import TangramPlay from '../tangram-play';
import TANGRAM_API from '../tangram-api.json';
import WidgetType from './widget-type';
import { subscribeMixin } from '../tools/mixin';
import { isStrEmpty } from '../editor/codemirror/tools';

export default class WidgetsManager {
    constructor () {
        subscribeMixin(this);

        this.data = []; // tokens to check
        this.pairedUntilLine = 0;

        // Initialize tokens
        for (let datum of TANGRAM_API.values) {
            if (datum.type === 'color' || datum.type === 'vector' || datum.type === 'boolean' || datum.type === 'string') {
                this.data.push(new WidgetType(datum));
            }
        }

        let from = { line:0, ch:0 };
        let to = {
            line: TangramPlay.editor.getDoc().size - 1,
            ch: TangramPlay.editor.getLine(TangramPlay.editor.getDoc().size - 1).length
        };
        this.createRange(from, to);

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
        TangramPlay.on('sceneload', (event) => {
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

        to.ch = TangramPlay.editor.getLine(to.line) ? TangramPlay.editor.getLine(to.line).length : 0;

        // If is a new line move the range FROM the begining of the line
        if (changeObj.text.length === 2 &&
            changeObj.text[0] === '' &&
            changeObj.text[1] === '') {
            from.ch = 0;
        }

        // Get the matching nodes for the FROM/TO range
        let nodes = TangramPlay.getNodes(from, to);
        // If there is no nodes there nothing to do
        if (!nodes || nodes.length === 0) {
            return;
        }

        // Get affected bookmarks
        let bookmarks = [];
        if (from.line === to.line && from.ch === to.ch) {
            // If the FROM/TO range is to narrow search using nodes
            for (let node of nodes) {
                // Find and concatenate bookmarks between FROM/TO range
                bookmarks = bookmarks.concat(TangramPlay.editor.getDoc().findMarksAt(node.range.to));
            }
        }
        else {
            bookmarks = TangramPlay.editor.getDoc().findMarksAt(to);
        }

        // If there is only one node and the change happen on the value
        if (nodes.length === 1 &&
            bookmarks.length === 1 &&
            from.ch > (nodes[0].range.from.ch + nodes[0].key.length + 2) &&
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

            // Create widgets from nodes
            this.createWidget(nodes);
        }
    }

    clearRange (from, to) {
        let nodes = TangramPlay.getNodes(from, to);

        if (!nodes || nodes.length === 0) {
            return;
        }

        this.clearNodes(nodes);
    }

    clearNodes (nodes) {
        let doc = TangramPlay.editor.getDoc();
        for (let node of nodes) {
            // Find bookmarks between FROM and TO
            let from = node.range.from.line;
            let to = node.range.to.line;
            let bookmarks = doc.findMarks({ line: from }, { line: to });

            // Delete those with widgets
            for (let bkm of bookmarks) {
                bkm.clear();
            }
        }
    }

    createRange (from, to) {
        // Search for nodes between FROM and TO
        let nodes = TangramPlay.getNodes(from, to);

        if (!nodes || nodes.length === 0) {
            return;
        }

        this.createWidget(nodes);
    }

    createWidget (nodes) {
        let newWidgets = [];
        for (let node of nodes) {
            let val = node.value;
            if (val === '|' || isStrEmpty(val) || isStrEmpty(TangramPlay.editor.getLine(node.range.from.line))) {
                continue;
            }

            // Check for widgets to add
            for (let datum of this.data) {
                if (datum.match(node)) {
                    // Create node
                    let widget = datum.create(node);
                    if (widget.insert()) {
                        newWidgets.push(widget);
                    }

                    if (this.pairedUntilLine < node.range.from.line) {
                        this.pairedUntilLine = node.range.from.line;
                    }
                    break;
                }
            }
        }

        // Trigger Events
        this.trigger('widgets_created', { widgets: newWidgets });
    }
}
