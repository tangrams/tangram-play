import ColorButton from './color-button';
import ToggleButton from './toggle-button';
import DropDownMenu from './drop-down-menu';
import VectorButton from './vector-button';

export default class WidgetConstructor {
    constructor (datum) {
        // Widgets exist for different types of Tangram scene syntax.
        //      value - a widget exists for this type of value (not used?)
        //      key - a widget exists when the key matches this
        //      address - a widget exists when the address (sequence of keys)
        //          matches this
        const matchTypes = [
            'value',
            'key',
            'address',
        ];

        // This normalizes the syntax matching method to a single property.
        for (const key of matchTypes) {
            if (datum[key]) {
                this.matchAgainst = key;
                this.matchPattern = datum[key];
                break;
            }
        }

        // The rest of the data is stored, with default values if not present
        this.type = datum.type;
        this.options = datum.options || [];
        this.source = datum.source || null;
    }

    match (node) {
        if (this.matchAgainst) {
            return RegExp(this.matchPattern).test(node[this.matchAgainst]);
        }
        else {
            return false;
        }
    }

    create (node) {
        let widgetObj;

        switch (this.type) {
            case 'color':
                widgetObj = new ColorButton(this, node);
                break;
            case 'boolean':
                widgetObj = new ToggleButton(this, node);
                break;
            case 'string':
                widgetObj = new DropDownMenu(this, node);
                break;
            case 'vector':
                widgetObj = new VectorButton(this, node);
                break;
            default:
                // Nothing
                break;
        }

        return widgetObj;
    }
}
