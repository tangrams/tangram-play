'use strict';
/* global thistle */

import Widget from './Widget.js';
import { toCSS } from '../../core/common.js';

export default class ColorPicker extends Widget {
    // There must be a constructor call here because
    // ColorPicker sets its own properties for color
    constructor (...args) {
        super(...args);

        // Set the color property from editor value
        this.color = toCSS(this.key.value);
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

    /**
     *  Returns widget background color when
     *  this.color is requested
     */
    get color () {
        return this.el.style.background;
    }

    /**
     *  Sets this.color
     *  Automatically changes widget background color
     *  Assumes color property is a CSS color.
     *  Be sure to convert value parameter to a CSS-readable value.
     */
    set color (cssColor) {
        this.el.style.background = cssColor;
    }

    set value (val) {
        super['value'](val);
        this.color = toCSS(val);
    }

    /**
     *  Handles when user clicks on the in-line color indicator widget
     */
    onClick (event) {
        this.picker = new thistle.Picker(this.color);
        let pos = this.getPosition();

        this.picker.presentModal(pos.x + 20, pos.y + 20);

        // Note: this fires change events as a live preview of the color.
        // TODO: Store original value so we can go back to it if the
        // interaction is canceled.
        this.picker.on('changed', this.onPickerChange.bind(this));
    }

    /**
     *  Handles when user selects a new color on the colorpicker
     */
    onPickerChange (event) {
        this.color = this.picker.getCSS();

        // Convert the CSS color value to Tangram format for editor.
        let color = this.picker.getRGB();
        let rgbString = `[${color.r.toFixed(3)}, ${color.g.toFixed(3)}, ${color.b.toFixed(3)}]`;
        this.setEditorValue(rgbString);
    }
}
