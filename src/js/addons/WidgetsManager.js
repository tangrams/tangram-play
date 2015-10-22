'use strict';

import TangramPlay from 'app/TangramPlay';

// Load some common functions
import { httpGet, subscribeMixin } from 'app/core/common';
import { isStrEmpty } from 'app/core/codemirror/tools';

// Load addons modules
import WidgetType from 'app/addons/widgets/WidgetType';

export default class WidgetsManager {
    constructor (configFile) {
        subscribeMixin(this);

        this.data = []; // tokens to check
        this.pairedUntilLine = 0;

        // Load data file
        httpGet(configFile, (err, res) => {
            let widgetsData = JSON.parse(res)['values'];

            // Initialize tokens
            for (let datum of widgetsData) {
                if (datum.type === 'color' || datum.type === 'boolean' || datum.type === 'string') {
                    this.data.push(new WidgetType(datum));
                }
            }

            let from = { line:0, ch:0 };
            let to = {
                line: TangramPlay.editor.getDoc().size - 1,
                ch: TangramPlay.editor.getLine(TangramPlay.editor.getDoc().size - 1).length
            };
            this.createRange(from, to);
        });

        // If something change only update that
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            for (let obj of changesObjs) {
                this.change(obj);
            }
        });

        // Keep track of possible NOT-PARSED lines
        // and in every codemirror "render update" check if we are approaching a
        // non-parsed area and for it to update by cleaning and creating
        TangramPlay.editor.on('scroll', (cm) => {
            let horizon = TangramPlay.editor.getViewport().to - 1;
            if (this.pairedUntilLine < horizon) {
                let from = {
                    line: this.pairedUntilLine + 1,
                    ch: 0
                };
                let to = {
                    line: horizon,
                    ch: TangramPlay.editor.getLine(horizon).length
                };
                this.clearRange(from, to);
                this.createRange(from, to);
            }
        });

        // If a new files is loaded reset the tracked line
        TangramPlay.on('url_loaded', (url) => {
            this.pairedUntilLine = 0;
        });
    }

    change (changeObj) {
        // Get FROM/TO range of the change
        let from = { line: changeObj.from.line, ch: changeObj.from.ch };
        let to = { line: changeObj.to.line, ch: changeObj.to.ch };

        if (changeObj.removed.length > changeObj.text.length) {
            from.line -= changeObj.removed.length - 1;
            to.line += 1;
        }
        else if (changeObj.removed.length < changeObj.text.length) {
            to.line = changeObj.from.line + changeObj.text.length - 1;
        }

        to.ch = TangramPlay.editor.getLine(to.line)? TangramPlay.editor.getLine(to.line).length : 0;

        // If is a new line move the range FROM the begining of the line
        if (changeObj.text.length === 2 &&
            changeObj.text[0] === '' &&
            changeObj.text[1] === '') {
            from.ch = 0;
        }

        // Get the matching keys for the FROM/TO range
        let keys = TangramPlay.getKeys(from, to);
        // If there is no keys there nothing to do
        if (!keys || keys.length === 0) {
            return;
        }

        // Get affected bookmarks
        let bookmarks = [];
        if (from.line === to.line && from.ch === to.ch) {
            // If the FROM/TO range is to narrow search using keys
            for (let key of keys) {
                // Find and concatenate bookmarks between FROM/TO range
                bookmarks = bookmarks.concat(TangramPlay.editor.getDoc().findMarks(key.range.from, key.range.to));
            }
        }
        else {
            bookmarks = TangramPlay.editor.getDoc().findMarks(from, to);
        }

        // If there is only one key and the change happen on the value
        if (keys.length === 1 &&
            bookmarks.length === 1 &&
            from.ch > keys[0].pos.ch &&
            bookmarks[0].widget) {
            // console.log("Updating value of ", bookmarks[0]);
            // Update the widget
            bookmarks[0].widget.update();
            // Trigger Events
            this.trigger('widget_updated', { widgets: bookmarks[0].widget });
        }
        else {
            // Delete those afected widgets
            for (let bkm of bookmarks) {
                bkm.clear();
            }

            // Create widgets from keys
            this.createKeys(keys);
        }
    }

    clearRange (from, to) {
        let keys = TangramPlay.getKeys(from, to);

        if (!keys || keys.length === 0) {
            return;
        }

        this.clearKeys(keys);
    }

    clearKeys (keys) {
        let doc = TangramPlay.editor.getDoc();
        for (let key of keys) {
            // Find bookmarks between FROM and TO
            let from = key.range.from.line;
            let to = key.range.to.line;
            let bookmarks = doc.findMarks({ line: from }, { line: to });

            // Delete those with widgets
            for (let bkm of bookmarks) {
                bkm.clear();
            }
        }
    }

    createRange (from, to) {
        // Search for keys between FROM and TO
        let keys = TangramPlay.getKeys(from, to);

        if (!keys || keys.length === 0) {
            return;
        }

        this.createKeys(keys);
    }

    createKeys (keys) {
        let newWidgets = [];
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
                    newWidgets.push(widget);

                    if (this.pairedUntilLine < key.pos.line) {
                        this.pairedUntilLine = key.pos.line;
                    }
                    break;
                }
            }
        }

        // Trigger Events
        this.trigger('widgets_created', { widgets: newWidgets });
    }
}
