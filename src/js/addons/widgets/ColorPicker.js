import Widget from "./Widget.js"

import { toCSS, getPosition } from '../../core/common.js';
import { setValue } from '../../core/codemirror/tools.js';
import { getKeyPairs, getValueRange, getAddressSceneContent } from '../../core/codemirror/yaml-tangram.js';

export default class ColorPicker extends Widget {
    constructor(manager, datum){
        super(manager,datum);
    }

    create(keyPair, cm) {
        let el = document.createElement('div');
        el.className = 'widget widget-colorpicker';
        el.value = keyPair.pos.line;
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
                setValue( cm, parseInt(el.value), str );
            });
        });
        return this.wrap(el,keyPair);
    }
};