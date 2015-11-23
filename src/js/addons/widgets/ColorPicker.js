'use strict';

import Widget from 'app/addons/widgets/Widget';
import ColorPickerModal from 'app/addons/widgets/ColorPickerModal';
import { toCSS, toColorVec } from 'app/core/common';

// When presenting the modal, offset X, Y of the the modal by
// these values, in pixels
const MODAL_X_OFFSET = 0;
const MODAL_Y_OFFSET = 5;

export default class ColorPicker extends Widget {
    // There must be a constructor call here because
    // ColorPicker sets its own properties for color
    constructor (...args) {
        super(...args);

        // Set the color property from editor value
        this.color = toCSS(this.node.value);
    }

    /**
     *  Creates an in-line color indicator widget
     */
    createEl () {
        let el = document.createElement('div');
        el.className = 'tp-widget tp-widget-colorpicker';
        el.addEventListener('click', this.onClick.bind(this));
        return el;
    }

    update() {
        super.update();

        // Set the color property from editor value
        this.color = toCSS(this.node.value);
    }

    /**
     *  Returns widget background color when
     *  this.color is requested
     */
    get color () {
        return this.el.style.backgroundColor;
    }

    /**
     *  Sets this.color
     *  Automatically changes widget background color
     *  Assumes color property is a CSS color.
     *  Be sure to convert value parameter to a CSS-readable value.
     */
    set color (cssColor) {
        this.el.style.backgroundColor = cssColor;
    }

    get value () {
        return super['value'];
    }

    set value (val) {
        super['value'] = val;
        this.color = toCSS(val);

        // Updates the color picker modal, if present.
        if (this.picker) {
            this.picker.setColor(this.color);
        }
    }

    /**
     *  Handles when user clicks on the in-line color indicator widget
     */
    onClick (event) {
        // Toggles the picker to be off if it's already present.
        if (this.picker && this.picker.isVisible) {
            this.picker.removeModal();
            return;
        }
        // If no picker is created yet, do it now
        else if (!this.picker) {
            this.picker = new ColorPickerModal(this.color);
        }

        // Turn the picker on and present modal at the desired position
        let pos = this.el.getBoundingClientRect();
        this.picker.presentModal(pos.left + MODAL_X_OFFSET, pos.bottom + MODAL_Y_OFFSET);

        // Note: this fires change events as a live preview of the color.
        // TODO: Store original value so we can go back to it if the
        // interaction is canceled.
        this.picker.on('changed', this.onPickerChange.bind(this));
    }

    /**
     *  Handles when user selects a new color on the colorpicker
     */
    onPickerChange (event) {
        let original = toColorVec(super['value']);
        this.color = this.picker.getCSS();

        // Convert the CSS color value to Tangram format for editor.
        let color = this.picker.getRGB();
        let rgbString = [1,1,1];
        if (typeof(original) === 'object' && original.a !== undefined) {
            rgbString = `[${color.r.toFixed(3)}, ${color.g.toFixed(3)}, ${color.b.toFixed(3)}, ${original.a}]`;
        }
        else {
            rgbString = `[${color.r.toFixed(3)}, ${color.g.toFixed(3)}, ${color.b.toFixed(3)}]`;
        }
        this.setEditorValue(rgbString);
    }
}
