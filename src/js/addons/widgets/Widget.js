/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */
'use strict';

import TangramPlay from 'app/TangramPlay';
import { editor } from 'app/TangramPlay';

export default class Widget {
    constructor (def, key) {
        this.key = key;
        this.definition = def;
        this.el = this.createEl(key);
    }

    /**
     *  Returns a widget element.
     *  This is a simple bare-bones example.
     *  Widgets that extend from this should create
     *  their own DOM and avoid calling super()
     *  @param key in case the element needs to know something about the source
     */
    createEl (key) {
        return document.createDocumentFragment();
    }

    destroy () {
        if (this.bookmark) {
            this.bookmark.clear();
        }
    }

    updateKey() {
        // Update key
        if (this.bookmark &&
            this.bookmark.lines &&
            this.bookmark.lines.length === 1 &&
            this.bookmark.lines[0] &&
            this.bookmark.lines[0].stateAfter &&
            this.bookmark.lines[0].stateAfter.yamlState &&
            this.bookmark.lines[0].stateAfter.yamlState.nodes &&
            this.bookmark.lines[0].stateAfter.yamlState.nodes.length > 0) {
            if (this.bookmark.lines[0].stateAfter.yamlState.nodes.length === 1) {
                if (this.key.address === this.bookmark.lines[0].stateAfter.yamlState.nodes[0].address) {
                    // console.log("key for widget easy to find");
                    this.key = this.bookmark.lines[0].stateAfter.yamlState.nodes[0];
                }
                else {
                    // console.log("key for widget hard to find 2");
                    this.key = TangramPlay.getNodesForAddress(this.key.address);
                }
            }
            else {
                for (let key of this.bookmark.lines[0].stateAfter.yamlState.nodes) {
                    if (this.key.address === key.address) {
                        // console.log("key for widget not so easy to find");
                        this.key = key;
                        break;
                    }
                }
            }
        }
        else {
            // console.log("key for widget hard to find");
            this.key = TangramPlay.getNodesForAddress(this.key.address);
        }

        // Fix empty line parser error
        if (this.bookmark &&
            this.bookmark.lines &&
            this.bookmark.lines.length === 1) {
            this.key.range.from.line = this.key.range.to.line = this.bookmark.lines[0].lineNo();
        }
    }

    update () {
        this.updateKey();
        // This looks weird but is to force the use of 'get value ()' which
        // clean the anchors
        this.value = this.value;
    }

    insert () {
        this.updateKey();

        // inserts the widget into CodeMirror DOM
        this.bookmark = editor.doc.setBookmark(this.key.range.to, {
            widget: this.el,
            insertLeft: true
        });
        this.bookmark.widget = this;
    }

    /**
     *  Use this property from outside the module (usually by)
     *  the WidgetManager to set a value inside the module.
     *  TODO: Experimental
     */
    get value () {
        let value = this.key.value;
        return value;
    }

    set value (value) {
        this.key.value = value;
    }

    /**
     *  Use this method within a module to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue(string) {
        this.updateKey();

        // Send the value to editor
        TangramPlay.setValue(this.key, string);

        // Change the value attached to this widget instance
        this.key.value = string;
    }
}
