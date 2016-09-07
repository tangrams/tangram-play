import { filter } from 'lodash';
import TANGRAM_API from '../../tangram-api.json';
import { isEmptyString } from '../../tools/helpers';

export class WidgetMark {
    constructor(datum) {
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

    match(node) {
        if (this.matchAgainst) {
            return RegExp(this.matchPattern).test(node[this.matchAgainst]);
        }

        return false;
    }
}

// Only certain types of values in Tangram syntax will have widgets, so
// filter out all other ones.
const listOfWidgetMarkConstructors = filter(TANGRAM_API.values, item =>
    item.type === 'color' || item.type === 'vector' ||
    item.type === 'boolean' || item.type === 'string'
);

// Create a set of ready-to-go widget objects.
// new WidgetMarkConstructor() is passed an object from TANGRAM_API.
const allWidgetMarkConstructors = listOfWidgetMarkConstructors.map(item => new WidgetMark(item));

/**
 * Given a state from YAML-Tangram parser, adds matching widget constructors
 * to each node.
 */
export function attachWidgetMarkConstructorsToDocumentState(state) {
    const nodes = state.nodes || [];
    for (const node of nodes) {
        const value = node.value;
        if (value === '|' || isEmptyString(value)) {
            continue; // eslint-disable-line no-continue
        }

        // Check for widgets to add
        for (const widgetMark of allWidgetMarkConstructors) {
            if (widgetMark.match(node)) {
                node.widgetMark = widgetMark;
                break;
            }
        }
    }

    return state;
}
