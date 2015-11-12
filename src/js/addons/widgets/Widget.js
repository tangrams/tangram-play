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
import { getValueRange } from 'app/core/codemirror/yaml-tangram';

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
            this.bookmark.lines[0].stateAfter.yamlState.keys &&
            this.bookmark.lines[0].stateAfter.yamlState.keys.length > 0) {
            if (this.bookmark.lines[0].stateAfter.yamlState.keys.length === 1) {
                if (this.key.address === this.bookmark.lines[0].stateAfter.yamlState.keys[0].address) {
                    // console.log("key for widget easy to find");
                    this.key = this.bookmark.lines[0].stateAfter.yamlState.keys[0];
                }
                else {
                    // console.log("key for widget hard to find 2");
                    this.key = TangramPlay.getKeyForAddress(this.key.address);
                }
            }
            else {
                for (let key of this.bookmark.lines[0].stateAfter.yamlState.keys) {
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
            this.key = TangramPlay.getKeyForAddress(this.key.address);
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
        this.value = this.key.value;
    }

    insert () {
        this.updateKey();
        let pos = this.key.range.to;

        // inserts the widget into CodeMirror DOM
        this.bookmark = editor.doc.setBookmark(pos, {
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
        return this.key.value;
    }

    set value (val) {
        this.key.value = val;
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
