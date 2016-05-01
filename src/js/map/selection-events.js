import _ from 'lodash';
import { emptyDOMElement } from '../tools/helpers';

const EMPTY_SELECTION_KIND_LABEL = 'Unknown feature';
const EMPTY_SELECTION_NAME_LABEL = '(unnamed)';

class TangramSelectionHover {
    constructor () {
        this.isDoingStuff = false;

        let el = this.el = document.createElement('div');
        el.className = 'map-selection-preview';
        el.style.display = 'none';

        let headerEl = this._headerEl = document.createElement('div');
        headerEl.className = 'map-selection-header';

        let kindEl = this._kindEl = document.createElement('div');
        kindEl.className = 'map-selection-kind-label';

        let nameEl = this._nameEl = document.createElement('div');
        nameEl.className = 'map-selection-name-label';

        headerEl.appendChild(kindEl);
        headerEl.appendChild(nameEl);

        let propertiesEl = this._propertiesEl = document.createElement('div');
        propertiesEl.className = 'map-selection-properties';
        propertiesEl.style.display = 'none';

        el.appendChild(headerEl);
        el.appendChild(propertiesEl);

        document.getElementById('map-container').appendChild(el);
    }

    show () {
        this.el.style.display = 'block';
    }

    hide () {
        this.el.style.display = 'none';
    }

    setPosition (x, y) {
        const width = this.el.getBoundingClientRect().width;
        this.el.style.left = (x - width / 2) + 'px';
        this.el.style.top = (y - 20) + 'px';
    }

    setLabel (properties) {
        this.kind = this.determineKindValue(properties);
        this.name = this.determineFeatureName(properties);
    }

    determineKindValue (properties) {
        // Kind is usually present on properties
        if (properties.kind) {
            return properties.kind;
        }
        // Sometimes there's no kind value but a key-value of "land: 'base'" (are there other values?)
        else if (properties.land) {
            return 'land';
        }
    }

    set kind (text) {
        if (typeof text === 'string') {
            text = text.replace(/_/g, ' ');
            text = _.capitalize(text);
        }
        else {
            text = EMPTY_SELECTION_KIND_LABEL;
        }

        this._kindEl.textContent = text;
    }

    get kind () {
        let text = this._kindEl.textContent;
        return text !== EMPTY_SELECTION_KIND_LABEL ? text : null;
    }

    determineFeatureName (properties) {
        if (properties.name) {
            return properties.name;
        }
        else if (properties['route_name']) {
            return properties['route_name'];
        }
        else if (properties.land) {
            return properties.land;
        }
        else if (properties['addr_housenumber'] && properties['addr_street']) {
            return `${properties['addr_housenumber']} ${properties['addr_street']}`;
        }
    }

    set name (text) {
        if (!text) {
            text = EMPTY_SELECTION_NAME_LABEL;
            this._nameEl.classList.add('map-selection-name-label-blank');
        }
        else {
            this._nameEl.classList.remove('map-selection-name-label-blank');
        }
        this._nameEl.textContent = text;
    }

    get name () {
        let text = this._nameEl.textContent;
        return text !== EMPTY_SELECTION_NAME_LABEL ? text : null;
    }

    showProperties (properties) {
        emptyDOMElement(this._propertiesEl);

        // Alphabetize key-value pairs
        let sorted = [];
        Object.keys(properties)
            .sort()
            .forEach(function (v, i) {
                sorted.push([v, properties[v]]);
            });

        for (let x in sorted) {
            const key = sorted[x][0];
            const value = sorted[x][1];

            const el = document.createElement('div');
            el.textContent = `${key}: ${value}`;
            this._propertiesEl.appendChild(el);
        }

        this._propertiesEl.style.display = 'block';
        // Resets scroll position (we don't want it to remember scroll position of the previous set of properties)
        this._propertiesEl.scrollTop = 0;
    }
}

const selectionEl = new TangramSelectionHover();

export function handleSelectionHoverEvent (selection) {
    if (selectionEl.isDoingStuff) {
        return;
    }

    // The .feature property does not always exist.
    // For instance, when the map is being dragged, there is no
    // feature being picked. So, make sure it is present.
    if (!selection.feature) {
        selectionEl.hide();
        return;
    }

    selectionEl.setLabel(selection.feature.properties);
    selectionEl.setPosition(selection.pixel.x, selection.pixel.y);
    selectionEl.show();
}

export function handleSelectionClickEvent (selection) {
    if (!selection.feature) {
        selectionEl.hide();
        return;
    }

    selectionEl.isDoingStuff = true;
    selectionEl.setLabel(selection.feature.properties);
    selectionEl.showProperties(selection.feature.properties);
    selectionEl.setPosition(selection.pixel.x, selection.pixel.y);
    selectionEl.show();
}
