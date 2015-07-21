import ColorPicker from './ColorPicker.js';
import ToggleButton from './ToggleButton.js';
import DropDownMenu from './DropDownMenu.js';

export default class WidgetType {
    constructor (datum) {
        const matchTypes = [
            'value',
            'key',
            'address',
        ];

        for (const key of matchTypes) {
            if (datum[key]) {
                this.matchAgainst = key;
                this.matchPattern = datum[key];
                break;
            }
        }

        this.type = datum.type;
        this.options = datum.options || [];
        this.source = datum.source || null;
    }

    match (keyPair) {
        if (this.matchAgainst) {
            return RegExp(this.matchPattern).test(keyPair[this.matchAgainst]);
        }
        else {
            return false;
        }
    }

    create (keyPair, cm) {
        let widgetObj;

        switch (this.type) {
            case 'colorpicker':
                widgetObj = new ColorPicker(this, keyPair, cm);
                break;
            case 'togglebutton':
                widgetObj = new ToggleButton(this, keyPair, cm);
                break;
            case 'dropdownmenu':
                widgetObj = new DropDownMenu(this, keyPair, cm);
                break;
            default:
                // Nothing
                break;
        }

        return widgetObj;
    }
}
