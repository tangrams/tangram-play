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

    createEl () {
        let el = document.createElement('div');

        el.className = 'tp-widget tp-widget-colorpicker';

        el.addEventListener('click', (e) => {
            let picker = new thistle.Picker(this.color);
            let pos = this.getPosition();

            picker.presentModal(pos.x + 20, pos.y + 20);
            picker.on('changed', (event) => {
                this.color = picker.getCSS();

                // Convert the CSS color value to Tangram format for editor.
                let color = picker.getRGB();
                let rgbString = '[' + color.r.toFixed(3) + ',' + color.g.toFixed(3) + ',' + color.b.toFixed(3) + ']';
                this.setEditorValue(rgbString);
            });
        });

        return el;
    }

    get color () {
        return this.el.style.background;
    }

    // Assumes color property is a CSS color.
    // Be sure to convert value parameter to a CSS-readable value.
    set color (cssColor) {
        this.el.style.background = cssColor;
    }
}
