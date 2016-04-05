import ColorButton from './ColorButton';
import ToggleButton from './ToggleButton';
import DropDownMenu from './DropDownMenu';
import VectorButton from './VectorButton';

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

    create (keyPair) {
        let widgetObj;

        switch (this.type) {
            case 'color':
                widgetObj = new ColorButton(this, keyPair);
                break;
            case 'boolean':
                widgetObj = new ToggleButton(this, keyPair);
                break;
            case 'string':
                widgetObj = new DropDownMenu(this, keyPair);
                break;
            case 'vector':
                widgetObj = new VectorButton(this, keyPair);
                break;
            default:
                // Nothing
                break;
        }

        return widgetObj;
    }
}
