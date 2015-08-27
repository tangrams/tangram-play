'use strict';

import TangramPlay from '../TangramPlay.js';

import ColorPickerModal from './widgets/ColorPickerModal.js';
import { toCSS } from '../core/common.js';

export default class ColorPalette {
    constructor() {
        if (TangramPlay.addons.widgetsManager === undefined) {
            return;
        }

        this.colors = {};
        this.palette = document.createElement("div");
        this.palette.className = 'tp-colorpalette';
        document.body.appendChild(this.palette);

        TangramPlay.map.layer.scene.subscribe({
            load: function (args) {
                TangramPlay.addons.colorPalette.update();
            }
        });

        TangramPlay.container.addEventListener('resize', (cm, from, to) => {
            this.palette.style.top = (window.innerHeight - this.palette.clientHeight).toString() + "px";
        });
    }

    update() {
        this.colors = {};

        let widgets = TangramPlay.addons.widgetsManager.active;
        for (let i = 0; i < widgets.length; i++ ) {
            if (widgets[i].definition.type === 'colorpicker') {
                let color = widgets[i].el.style.backgroundColor;
                if (this.colors[color] === undefined) {
                    this.colors[color] = new Color(color);
                }
                this.colors[color].widgets.push(widgets[i]);
            }
        }
        this.make();
    }

    make() {
        this.palette.innerHTML = '';
        for (let color in this.colors) {
            this.palette.appendChild(this.colors[color].el);
        }

        this.palette.style.top = (window.innerHeight - this.palette.clientHeight).toString() + "px";
    }
}

class Color {
    constructor(color) {
        color = toCSS(color);

        // DOM
        this.el = document.createElement('div');
        this.el.className = 'tp-colorpalette-element';
        this.el.style.background = color;
        this.el.addEventListener('click', this.onClick.bind(this));

        // Local Variables
        this.widgets = [];
        this.color = color;
    }

    /**
     *  Sets this.color
     *  Automatically changes widget background color
     *  Assumes color property is a CSS color.
     *  Be sure to convert value parameter to a CSS-readable value.
     */
    set color(cssColor) {
        this.el.style.backgroundColor = cssColor;
        this.el.style.background = cssColor;
    }

    get color() {
        return this.el.style.background;
    }

    onClick(event) {
        console.log(this);

        // Toggles the picker to be off if it's already present.
        if (this.picker && this.picker.isVisible) {
            this.picker.removeModal();
            return;
        }
        // If no picker is created yet, do it now
        else if (!this.picker) {
            this.picker = new ColorPickerModal(this.color);
        }

        // Turn the picker on and present modal
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

        this.picker.presentModal(modalXPos + 10, modalYPos + 3);

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

        for (let i = 0; i < this.widgets.length; i++) {
            this.widgets[i].setEditorValue(rgbString);
        }
    }
}