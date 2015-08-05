'use strict';

import Widget from './Widget.js';
import ColorPickerModal from './ColorPickerModal.js';
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
        super['value'](val);
        this.color = toCSS(val);
    }

    /**
     *  Handles when user clicks on the in-line color indicator widget
     */
    onClick (event) {
        this.picker = new ColorPickerModal(this.color);
        let pos = this.el.getBoundingClientRect();

        // Thistle modal size
        const modalWidth = 260;
        const modalHeight = 270;

        // Desired buffer from edge of window
        const modalBuffer = 20;

        // Set x, y pos depending on widget position. Do not allow the modal
        // to disappear off the edge of the window.
        let modalXPos = (pos.right + modalWidth < window.innerWidth) ? pos.right : (window.innerWidth - modalBuffer - modalWidth);
        let modalYPos = (pos.bottom + modalHeight < window.innerHeight) ? pos.bottom : (window.innerHeight - modalBuffer - modalHeight);

        this.picker.presentModal(modalXPos + 3, modalYPos + 3);

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
