const EMPTY_SELECTION_KIND_LABEL = 'Unknown feature';
const EMPTY_SELECTION_NAME_LABEL = '(unnamed)';

class TangramSelectionHover {
    constructor () {
        let el = this.el = document.createElement('div');
        el.className = 'map-selection-preview';
        el.style.display = 'none';

        let kindEl = this._kindEl = document.createElement('div');
        kindEl.className = 'map-selection-kind-label';

        let nameEl = this._nameEl = document.createElement('div');
        nameEl.className = 'map-selection-name-label';

        el.appendChild(kindEl);
        el.appendChild(nameEl);

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
            text = _capitalizeFirstLetter(text);
        }
        else {
            text = EMPTY_SELECTION_KIND_LABEL;
        }

        this._kindEl.textContent = text;

        function _capitalizeFirstLetter (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
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
}

const selectionEl = new TangramSelectionHover();

export function handleSelectionEvent (selection) {
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
