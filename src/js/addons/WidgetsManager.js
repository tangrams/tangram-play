'use strict';

import TangramPlay from '../TangramPlay.js';

// Load some common functions
import { httpGet, debounce, subscribeMixin } from '../core/common.js';
import { isStrEmpty } from '../core/codemirror/tools.js';

// Load addons modules
import WidgetType from './widgets/WidgetType.js';

var stopAction = debounce(function(wm) {
    wm.update();
}, 100);

var stopMicroAction = debounce(function(wm, nLine) {
    wm.updateLine(nLine);
}, 1000);

export default class WidgetsManager {
    constructor(configFile) {
        subscribeMixin(this);

        // Local variables
        this.totalLines = 0; // keep track of linesf
        this.pairedUntil = 0;
        this.forceBuild = true; // build widget - key sync
        this.data = []; // tokens to check
        this.active = []; // active widgets
        this.building = false;
        this.updating = false;

        // Load data file
        httpGet(configFile, (err, res) => {
            let widgetsData = JSON.parse(res)['values'];

            // Initialize tokens
            for (let datum of widgetsData) {
                this.data.push(new WidgetType(datum));
            }

            // Build all widgets
            this.build();
        });

        TangramPlay.editor.on('update', (cm, changesObj) => {
            let to = TangramPlay.editor.getViewport().to;

            if (this.pairedUntil > TangramPlay.editor.getDoc().size) {
                this.pairedUntil = 0;
                this.forceBuild = true;

                // console.log(this.pairedUntil + '/' + TangramPlay.editor.getDoc().size, to);
                stopAction(this);
            }
            else if (this.pairedUntil < to) {
                for (let i = this.pairedUntil; i < to; i++) {
                    this.rebuildLine(i);
                }
                this.pairedUntil = to;

                // console.log(this.pairedUntil + '/' + TangramPlay.editor.getDoc().size, to);
                stopAction(this);
            }
        });

        // // Suggestions are trigged by the folowing CM events
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
                this.forceBuild = true;
                stopAction(this);
            }
            else if (lineChange !== -1) {
                stopMicroAction(this, lineChange);
            }
        });

        TangramPlay.editor.on('fold', (cm, from, to) => {
            this.forceBuild = true;
            stopAction(this);
        });

        TangramPlay.editor.on('unfold', (cm, from, to) => {
            this.forceBuild = true;
            stopAction(this);
        });

        TangramPlay.on('resize', (args) => {
            this.forceBuild = true;
            this.update();
        });

        TangramPlay.on('url_loaded', (args) => {
            this.clean();
            this.forceBuild = true;
            this.pairedUntil = 0;
            stopAction(this);
        });
    }

    build() {
        if (!this.building) {
            this.building = true;
            if (this.active.length > 0) {
                this.clean();
            }

            for (let line = 0, size = TangramPlay.editor.doc.size; line < size; line++) {
                this.buildLine(line);
            }

            // the key~widget pairs is new
            this.totalLines = TangramPlay.editor.getDoc().size;
            this.forceBuild = false;

            // update position
            this.update();

            this.building = false;
        }
    }

    buildLine(nLine) {
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

    rebuildLine(nLine) {
        this.cleanLine(nLine);
        this.buildLine(nLine);
    }

    // Update widgets unless something is not right
    update() {
        if (this._isPairingDirty()) {
            // If there is different number of lines force a rebuild
            this.build();
        }
        else {
            if (!this.updating) {
                this.updating = true;

                // If the lines are the same proceed to update just the position
                for (let widget of this.active) {
                    let nLine = widget.key.pos.line;
                    let index = widget.key.index;
                    let keys = TangramPlay.getKeysOnLine(nLine);

                    if (TangramPlay.editor.getLineHandle(nLine) && TangramPlay.editor.getLineHandle(nLine).height) {
                        if (index < keys.length) {
                            widget.update();
                        }
                        else {
                            this.rebuildLine(nLine);
                            break;
                        }
                    }
                    // NOTE: If the condition above never becomes true,
                    // this can put TangramPlay into an infinite loop.
                    // TODO: Catch this, never let it happen
                    else {
                        this.forceBuild = true;
                        this.build();
                        break;
                    }
                }

                this.trigger('update', { lines: 'all', widgets: this.active });
                this.updating = false;
            }
        }
    }

    updateLine(nLine) {
        // If the Line is already parsed and visible
        if (TangramPlay.editor.getLineHandle(nLine) && TangramPlay.editor.getLineHandle(nLine).height) {
            let widgets = this.getWidgetsOnLine(nLine);
            let keys = TangramPlay.getKeysOnLine(nLine);

            // Check that the keys~widgets are paired
            if (widgets.length !== keys.length) {
                // If the amount of keys and widgets doesn't match, force a full rebuild
                this.forceBuild = true;
                this.build();
            }
            else {
                for (let widget of widgets) {
                    widget.update();
                }

                this.trigger('update', { lines: nLine, widgets: widgets });
            }
        }
    }

    // Erase all widgets
    clean() {
        while (this.active.length > 0) { // While there are still active widgets,
            let widget = this.active.pop(); // ...take the last widget off the list of active widgets
            widget.destroyEl(); // ...and remove its DOM from the page
        }
    }

    // Erase the widgets on one line
    cleanLine(nLine) {
        for (let i = this.active.length - 1; i >= 0; i--) { // Look through each of the active widgets
            let widget = this.active[i];
            if (widget.key.pos.line === nLine) { // If widget is on the line (passed as nLine parameter)
                this.active.splice(i, 1); // ...then remove it from the list of active widgets
                widget.destroyEl(); // and remove its DOM from the page
            }
        }
    }

    getWidgetsOnLine(nLine) {
        let widgetsOnLine = [];
        for (let i = 0; i < this.active.length ; i++) {
            if (this.active[i].key.pos.line === nLine) {
                widgetsOnLine.push(this.active[i]);
            }
        }
        return widgetsOnLine;
    }

    // Is keys~widgets pairs dirty? (usually after lines are been added)
    _isPairingDirty() {
        return this.forceBuild || this.totalLines !== TangramPlay.editor.getDoc().size;
    }

}
