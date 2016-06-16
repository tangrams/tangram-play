import _ from 'lodash';
import TANGRAM_API from '../../tangram-api.json';
import WidgetType from '../../widgets/widget-type';

import { isEmptyString } from '../../tools/helpers';

// Only certain types of values in Tangram syntax will have widgets, so
// filter out all other ones.
const widgetToMakeWidgetsFor = _.filter(TANGRAM_API.values, function (item) {
    return item.type === 'color' || item.type === 'vector' || item.type === 'boolean' || item.type === 'string';
});

// Create a set of ready-to-go widget objects.
const allWidgetTypes = widgetToMakeWidgetsFor.map(function (item) {
    // new WidgetType() is passed an object from TANGRAM_API.
    return new WidgetType(item);
});

export function addWidgets (state) {
    const nodes = state.nodes || [];
    for (let node of nodes) {
        let value = node.value;
        if (value === '|' || isEmptyString(value)) {
            continue;
        }

        // Check for widgets to add
        for (let widgetType of allWidgetTypes) {
            if (widgetType.match(node)) {
                node.widget = widgetType;
                break;
            }
        }
    }

    return state;
}
