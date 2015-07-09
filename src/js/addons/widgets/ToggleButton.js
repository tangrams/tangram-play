import Widget from "./Widget.js"

import { setValue } from '../../core/codemirror/tools.js';
import { getKeyPairs, getValueRange, getAddressSceneContent } from '../../core/codemirror/yaml-tangram.js';

export default class ToggleButton extends Widget {
    constructor(manager, datum){
        super(manager,datum);
    }

    create(keyPair, cm) {
        let el = document.createElement('input');
        el.type = 'checkbox';
        el.className = 'widget widget-toggle';
        el.checked = (keyPair.value === 'true') ? true : false;
        el.value = keyPair.pos.line;
        el.addEventListener('change', function (e) {
            setValue(cm, parseInt(el.value), el.checked?"true":"false" );
        });
        return this.wrap(el,keyPair);
    }
};
