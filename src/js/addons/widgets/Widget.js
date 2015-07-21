/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */

import { getPosition } from '../../core/common.js';

// Store reference to the editor on this module
let editor;

export default class Widget {
    constructor (def, key, cm) {
        this.key = key;
        this.definition = def;
        this.el = this.createEl();

        // Store a reference to the editor
        editor = cm;
    }

    // Returns a widget element.
    // This is a simple bare-bones example.
    // Widgets that extend from this should create
    // their own DOM and avoid calling super()
    createEl () {
        return document.createDocumentFragment();
    }

    // Removes the widget element from DOM.
    destroyEl () {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    // Returns x, y position of the upper left corner
    // of the DOM element for the widget. Useful
    // for positioning modals, etc.
    getPosition () {
        return getPosition(this.el);
    }

    // Future
    updatePosition () {

    }

    // Use this method to communicate a value back to
    // the Tangram Play editor.
    setEditorValue (string) {
        // Send the value to editor
        editor.tangram_play.setValue(this.key, string);

        // Change the value attached to this widget instance
        this.key.value = string;
    }
}
