'use strict';

import TangramPlay from 'app/TangramPlay';

// Load some common functions
import { httpGet, debounce, subscribeMixin } from 'app/core/common';
import { isStrEmpty } from 'app/core/codemirror/tools';

// Load addons modules
import WidgetType from 'app/addons/widgets/WidgetType';

var stopAction = debounce(function(wm) {
    wm.update();
}, 100);

var stopMicroAction = debounce(function(wm, nLine) {
    wm.updateLine(nLine);
}, 100);

export default class WidgetsManager {
    constructor(configFile) {
        subscribeMixin(this);

        this.data = []; // tokens to check

        // Load data file
        httpGet(configFile, (err, res) => {
            let widgetsData = JSON.parse(res)['values'];

            // Initialize tokens
            for (let datum of widgetsData) {
                if (datum.type === "color" || datum.type === "boolean" || datum.type === "string") {
                    this.data.push(new WidgetType(datum));
                }
            }

            // Build all widgets
            this.create({
                            line:0,
                            ch:0
                        },
                        {
                            line: TangramPlay.editor.getDoc().size-1,
                            ch: TangramPlay.editor.getLine(TangramPlay.editor.getDoc().size-1).length
                        });
        });

        // // Suggestions are trigged by the folowing CM events
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            for (let obj of changesObjs) {
                this.clear(obj.from,obj.to);
                this.create(obj.from,obj.to);
            }
        });
    }

    create(from, to) {
        let keys = TangramPlay.getKeys(from,to);
        if (keys) {
            for (let key of keys) {
                let val = key.value;

                if (val === '|' || isStrEmpty(val) || isStrEmpty(TangramPlay.editor.getLine(key.pos.line))) {
                    continue;
                }

                // Check for widgets to add
                for (let datum of this.data) {
                    if (datum.match(key)) {
                        let widget = datum.create(key);
                        widget.insert();
                        break;
                    }
                }
            }
        }

    }

    clear(from, to) {
        // Delete widgets
        let bookmarks = TangramPlay.editor.doc.findMarks(from,to);
        for (let bkm of bookmarks) {
            bkm.clear();
        }
    }
}
