import Widget from "./Widget.js"

import { toCSS, getPosition } from '../../core/common.js';

export default class ColorPicker extends Widget {
    constructor(manager, datum){
        super(manager,datum);
    }

    create(keyPair, cm) {
        let el = document.createElement('div');
        el.className = 'tangram-play-widget tangram-play-widget-colorpicker';
        el.value = String(keyPair.pos.line) + "-" + String(keyPair.index);

        el.style.background = toCSS(keyPair.value);
        el.addEventListener('click', function (e) {
            let picker = new thistle.Picker(el.style.background);
            let pos = getPosition(el);
            picker.presentModal(pos.x+20,
                                cm.heightAtLine(parseInt(el.value))+20);

            picker.on('changed', function() {
                el.style.background = picker.getCSS();
                let color = picker.getRGB();
                let str = "["+ color.r.toFixed(3) + "," + color.g.toFixed(3) + "," + color.b.toFixed(3) + "]";
                cm.tangram_play.setValue(cm.tangram_play.getKeyForStr(el.value),str);

            });
        });
        return this.wrap(el,keyPair);
    }
};