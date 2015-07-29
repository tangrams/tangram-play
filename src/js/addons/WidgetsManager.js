// Load some common functions
import { fetchHTTP, debounce } from '../core/common.js';
import { isStrEmpty } from '../core/codemirror/tools.js';
import { getValueRange } from '../core/codemirror/yaml-tangram.js';

// Load addons modules
import WidgetType from './widgets/WidgetType.js';

export default class WidgetsManager {
    constructor (tangram_play, configFile ) {

        // Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.widgets_manager = this;

        // Local variables
        this.tangram_play = tangram_play;
        this.fresh = true;  // widget - key sync
        this.data = [];     // tokens to check
        this.active = [];   // active widgets

        // Load data file
        let widgets_data = JSON.parse(fetchHTTP(configFile))['widgets'];

        // Initialize tokens
        for (let datum of widgets_data) {
            this.data.push(new WidgetType(datum));
        }

        // Suggestions are trigged by the folowing CM events

        //  When there is a change
        tangram_play.editor.on('update', (cm, changesObj) => {
            this.fresh = false;
            this.update();
            this.stopAction();
        });

        // When the viewport change (lines are add or erased)
        tangram_play.editor.on('viewportChange', (cm, from, to) => {
            this.fresh = false;
            this.rebuild();
        });

        tangram_play.editor.on('unfold', (cm, from, to) => {
            this.fresh = false;
            this.rebuild();
        });

        // Build all widgets
        this.build();
    }

    build() {
        for (let line = 0, size = this.tangram_play.editor.doc.size; line < size; line++) {
            this.addWidgetsTo(line);
        }
        this.fresh = true;
        this.update();
    }

    rebuild() {
        if (!this.fresh) {
            this.deleteAll();
            this.build();
        }
    }

    rebuildLine(nLine) {
        this.deleteLine(nLine);
        this.addWidgetsTo(nLine);
    }

    addWidgetsTo(nLine) {
        // If is visible
        if (this.tangram_play.editor.getLineHandle(nLine) && this.tangram_play.editor.getLineHandle(nLine).height) {
            // Get keys of the line
            let keys = this.tangram_play.getKeysOnLine(nLine);
            if (keys) {
                // Check on every key of the line
                for (let key of keys) {
                    let val = key.value;

                    if (val === '|' || isStrEmpty(val) || isStrEmpty(editor.getLine(nLine)) ) {
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
        for (let widget of this.active) {
            let line = widget.key.pos.line;
            let index = widget.key.index;
            let keys = this.tangram_play.getKeysOnLine(line);

            if (this.tangram_play.editor.getLineHandle(line) && this.tangram_play.editor.getLineHandle(line).height) {
                if (index < keys.length) {
                    let pos = getValueRange(widget.key).to;
                    this.tangram_play.editor.addWidget(pos, widget.el);
                } else {
                    this.rebuildLine(line);
                    break;
                }
            }
            // NOTE: If the condition above never becomes true,
            // this can put TangramPlay into an infinite loop.
            // TODO: Catch this, never let it happen
            else {
                this.fresh = false;
                this.rebuild();
                break;
            }

        }
    }

    // Erase the widgets on one line
    deleteLine (nLine) {
        for (let i = this.active.length - 1; i >= 0; i--) { // Look through each of the active widgets
            let widget = this.active[i];
            if (widget.key.pos.line === nLine) { // If widget is on the line (passed as nLine parameter)
                this.active.splice(i, 1); // ...then remove it from the list of active widgets
                widget.destroyEl(); // and remove its DOM from the page
            }
        }
    }

    // Erase all widgets
    deleteAll () {
        while (this.active.length > 0) { // While there are still active widgets,
            let widget = this.active.pop(); // ...take the last widget off the list of active widgets
            widget.destroyEl(); // ...and remove its DOM from the page
        }
    }

    // Debounced event after user stop doing something
    stopAction () {
        debounce(() => {
            this.rebuild();
        }, 1000);
    }
}
