'use strict';

import TangramPlay from '../TangramPlay.js';

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
                this.colors[widgets[i].el.style.backgroundColor] = widgets[i];
            }
        }
        this.make();
    }

    make() {
        this.palette.innerHTML = '';
        for (let color in this.colors) {
            let el = document.createElement('div');
            el.className = 'tp-colorpalette-element';
            el.style.background = color;
            this.palette.appendChild(el);
        }

        this.palette.style.top = (window.innerHeight - this.palette.clientHeight).toString() + "px";
    }
}