import _ from 'lodash';
import TANGRAM_API from '../../tangram-api.json';
import WidgetConstructor from '../../widgets/widget-type';
import { isEmptyString } from '../../tools/helpers';

// Only certain types of values in Tangram syntax will have widgets, so
// filter out all other ones.
const listOfWidgetConstructors = _.filter(TANGRAM_API.values, function (item) {
    return item.type === 'color' || item.type === 'vector' || item.type === 'boolean' || item.type === 'string';
});

// Create a set of ready-to-go widget objects.
const allWidgetConstructors = listOfWidgetConstructors.map(function (item) {
    // new WidgetConstructor() is passed an object from TANGRAM_API.
    return new WidgetConstructor(item);
});

/**
 * Given a state from YAML-Tangram parser, adds matching widget constructors
 * to each node.
 */
export function attachWidgetConstructorsToDocumentState (state) {
    const nodes = state.nodes || [];
    for (let node of nodes) {
        const value = node.value;
        if (value === '|' || isEmptyString(value)) {
            continue;
        }

        // Check for widgets to add
        for (let widgetConstructor of allWidgetConstructors) {
            if (widgetConstructor.match(node)) {
                node.widgetConstructor = widgetConstructor;
                break;
            }
        }
    }

    return state;
}
