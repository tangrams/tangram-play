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
import { getPosition } from 'app/core/common';
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

    /**
     *  Removes the widget element from DOM.
     */
    destroyEl () {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    /**
     *  Returns x, y position of the upper left corner
     *  of the DOM element for the widget, relative to parent
     *  DOM containers. Use this.el.getBoundingClientRect()
     *  as an alternative for positioning relative to the
     *  viewport (for positioning secondary interactive UI
     *  elements, for example).
     */
    getPosition () {
        return getPosition(this.el);
    }

    update() {
        // Update key
        this.key = TangramPlay.getKeyForKey(this.key);
        this.value = this.key.value;

        // Update position
        let pos = getValueRange(this.key).to;
        //editor.addWidget(pos, this.el);
        // cm.addWidget does not update automatically;
        // whereas cm.doc.setBookmark includes the element in the CM dom.
        editor.doc.setBookmark(pos, {
            widget: this.el,
            insertLeft: true
        });
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
        // Send the value to editor
        this.key = TangramPlay.getKeyForKey(this.key);
        TangramPlay.setValue(this.key, string);

        // Change the value attached to this widget instance
        this.key.value = string;

        // Update the position
        TangramPlay.addons.widgetsManager.updateLine(this.key.pos.line);
    }
}
