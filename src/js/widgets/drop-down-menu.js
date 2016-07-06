/*
import { tangramLayer } from '../map/map';
import Widget from './widget';
import { getAddressSceneContent } from '../editor/codemirror/yaml-tangram';

export default class DropDownMenu extends Widget {
    createEl () {
        let el = document.createElement('select');
        el.className = 'widget widget-dropdown';
        el.setAttribute('cm-ignore-events', 'true');

        // Add empty option
        let newOption = document.createElement('option');

        if (this.node.value === '') {
            newOption.selected = true;
        }

        newOption.value = '';
        newOption.textContent = '--Select--';
        el.appendChild(newOption);

        // Add static options
        for (let value of this.definition.options) {
            let newOption = document.createElement('option');

            if (this.node.value === value) {
                newOption.selected = true;
            }

            newOption.value = value;
            newOption.textContent = value;
            el.appendChild(newOption);
        }

        // Add dinamic options from source
        if (this.definition.source) {
            let obj = getAddressSceneContent(tangramLayer.scene, this.definition.source);
            let keys = (obj) ? Object.keys(obj) : {};

            for (let j = 0; j < keys.length; j++) {
                let newOption = document.createElement('option');

                if (this.node.value === keys[j]) {
                    newOption.selected = true;
                }

                newOption.value = keys[j];
                newOption.textContent = keys[j];
                el.appendChild(newOption);
            }
        }

        el.addEventListener('change', (event) => {
            this.setEditorValue(el.options[el.selectedIndex].value);
        });

        return el;
    }
}
*/
