'use strict';

import TangramPlay from '../TangramPlay.js';

// Load some common functions
import { fetchHTTP, debounce } from '../core/common.js';
import { isStrEmpty } from '../core/codemirror/tools.js';
import { getValueRange } from '../core/codemirror/yaml-tangram.js';

// Load addons modules
import WidgetType from './widgets/WidgetType.js';

var stopAction = debounce(function(wm) {
    wm.update();
}, 100);

var stopMicroAction = debounce(function(wm, nLine) {
    wm.rebuildLine(nLine);
    wm.update();
}, 1000);

export default class WidgetsManager {
    constructor(configFile) {
        // Local variables
        this.totalLines = 0; // keep track of linesf
        this.pairedUntil = 0;
        this.forceRebuild = true; // build widget - key sync
        this.data = []; // tokens to check
        this.active = []; // active widgets

        // Load data file
        let widgetsData = JSON.parse(fetchHTTP(configFile))['widgets'];

        // Initialize tokens
        for (let datum of widgetsData) {
            this.data.push(new WidgetType(datum));
        }

        // Build all widgets
        this.build();

        TangramPlay.editor.on('update', (cm, changesObj) => {
            let to = TangramPlay.editor.getViewport().to;

            if (this.pairedUntil > TangramPlay.editor.getDoc().size) {
                this.pairedUntil = 0;
                this.forceRebuild = true;

                // console.log(this.pairedUntil + '/' + TangramPlay.editor.getDoc().size, to);
                stopAction(this);
            }
            else if (this.pairedUntil < to) {
                for (let i = this.pairedUntil; i < to; i++) {
                    this.addWidgetsTo(i);
                }
                this.pairedUntil = to;

                // console.log(this.pairedUntil + '/' + TangramPlay.editor.getDoc().size, to);
                stopAction(this);
            }
        });

        // Suggestions are trigged by the folowing CM events
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            // Is a multi line change???
            let lineChange = -1;
            let multiLine = false;
            for (let i = 0; i < changesObjs.length; i++) {
                // If the change happen in a single line
                if (changesObjs[i].from.line === changesObjs[i].to.line) {
                    if (lineChange === -1) {
                        lineChange = changesObjs[i].from.line;
                    }
                    else if (lineChange !== changesObjs[i].from.line) {
                        multiLine = true;
                        break;
                    }
                }
                else {
                    multiLine = true;
                    break;
                }
            }

            if (multiLine) {
                this.forceRebuild = true;
                stopAction();
            }
            else if (lineChange !== -1) {
                stopMicroAction(this, lineChange);
            }
        });

        TangramPlay.editor.on('fold', (cm, from, to) => {
            this.forceRebuild = true;
            stopAction(this);
        });

        TangramPlay.editor.on('unfold', (cm, from, to) => {
            this.forceRebuild = true;
            stopAction(this);
        });

        TangramPlay.container.addEventListener('resize', (cm, from, to) => {
            this.forceRebuild = true;
            this.update();
        });

        TangramPlay.container.addEventListener('loaded', (cm, from, to) => {
            this.deleteAll();
            this.forceRebuild = true;
            this.pairedUntil = 0;
            stopAction(this);
        });
    }

    build() {
        for (let line = 0, size = TangramPlay.editor.doc.size; line < size; line++) {
            this.addWidgetsTo(line);
        }

        // the key~widget pairs is new
        this.totalLines = TangramPlay.editor.getDoc().size;
        this.forceRebuild = false;

        // update position
        this.update();
    }

    rebuild() {
        this.deleteAll();
        this.build();
    }

    rebuildLine(nLine) {
        this.deleteLine(nLine);
        this.addWidgetsTo(nLine);
    }

    addWidgetsTo(nLine) {
        // If is visible
        if (TangramPlay.editor.getLineHandle(nLine) && TangramPlay.editor.getLineHandle(nLine).height) {
            // Get keys of the line
            let keys = TangramPlay.getKeysOnLine(nLine);
            if (keys) {
                // Check on every key of the line
                for (let key of keys) {
                    let val = key.value;

                    if (val === '|' || isStrEmpty(val) || isStrEmpty(TangramPlay.editor.getLine(nLine))) {
                        continue;
                    }

                    // Check for widgets to add
                    for (let datum of this.data) {
                        if (datum.match(key)) {
                            this.active.push(datum.create(key));
                            break;
                        }
                    }
                }
            }
        }
    }

    // Update widgets unless something is not right
    update() {
        if (this._isPairingDirty()) {
            // If there is different number of lines force a rebuild
            this.rebuild();
        }
        else {
            // If the lines are the same proceed to update just the position
            for (let widget of this.active) {
                let line = widget.key.pos.line;
                let index = widget.key.index;
                let keys = TangramPlay.getKeysOnLine(line);

                if (TangramPlay.editor.getLineHandle(line) && TangramPlay.editor.getLineHandle(line).height) {
                    if (index < keys.length) {
                        let pos = getValueRange(keys[index]).to;
                        TangramPlay.editor.addWidget(pos, widget.el);
                    }
                    else {
                        this.rebuildLine(line);
                        break;
                    }
                }
                // NOTE: If the condition above never becomes true,
                // this can put TangramPlay into an infinite loop.
                // TODO: Catch this, never let it happen
                else {
                    this.forceRebuild = true;
                    this.rebuild();
                    break;
                }
            }
        }
    }

    // Erase the widgets on one line
    deleteLine(nLine) {
        for (let i = this.active.length - 1; i >= 0; i--) { // Look through each of the active widgets
            let widget = this.active[i];
            if (widget.key.pos.line === nLine) { // If widget is on the line (passed as nLine parameter)
                this.active.splice(i, 1); // ...then remove it from the list of active widgets
                widget.destroyEl(); // and remove its DOM from the page
            }
        }
    }

    // Erase all widgets
    deleteAll() {
        while (this.active.length > 0) { // While there are still active widgets,
            let widget = this.active.pop(); // ...take the last widget off the list of active widgets
            widget.destroyEl(); // ...and remove its DOM from the page
        }
    }

    // Is keys~widgets pairs dirty? (usually after lines are been added)
    _isPairingDirty() {
        return this.forceRebuild || this.totalLines !== TangramPlay.editor.getDoc().size;
    }

}
