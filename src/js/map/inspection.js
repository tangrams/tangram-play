import _ from 'lodash';
import L from 'leaflet';
import { map } from './map';
import { emptyDOMElement } from '../tools/helpers';
import TangramPlay from '../tangram-play';
import { editor } from '../editor/editor';
import { highlightBlock, unhighlightAll } from '../editor/highlight';

const EMPTY_SELECTION_KIND_LABEL = 'Unknown feature';
const EMPTY_SELECTION_NAME_LABEL = '(unnamed)';

let isPopupOpen = false;
let currentPopupX, currentPopupY;

class TangramInspectionPopup {
    constructor () {
        let el = this.el = document.createElement('div');
        el.className = 'map-inspection';
        el.style.display = 'none';

        let headerEl = this._headerEl = document.createElement('div');
        headerEl.className = 'map-inspection-header';

        let kindEl = this._kindEl = document.createElement('div');
        kindEl.className = 'map-inspection-kind-label';

        let nameEl = this._nameEl = document.createElement('div');
        nameEl.className = 'map-inspection-name-label';

        headerEl.appendChild(kindEl);
        headerEl.appendChild(nameEl);

        let propertiesEl = this._propertiesEl = document.createElement('div');
        propertiesEl.className = 'map-inspection-properties';
        propertiesEl.style.display = 'none';

        let layersEl = this._layersEl = document.createElement('div');
        layersEl.className = 'map-inspection-layers';
        layersEl.style.display = 'none';

        let closeEl = this._closeEl = document.createElement('div');
        closeEl.className = 'map-inspection-close';
        closeEl.textContent = '×';
        closeEl.style.display = 'none';
        // Listeners for this will be added later, during popup creation

        el.appendChild(headerEl);
        el.appendChild(propertiesEl);
        el.appendChild(layersEl);
        el.appendChild(closeEl);

        document.getElementById('map-container').appendChild(el);
    }

    showAt (x = 0, y = 0) {
        // Guarantee that positioning and sizing calculations occur
        // after DOM content has been placed
        this.el.style.display = 'block';
        this.el.style.position = 'absolute';

        const rect = this.el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.el.style.left = (x - width / 2) + 'px';
        // TODO: don't hardcode magic number
        this.el.style.top = (y - height - 24) + 'px';
    }

    resetPosition () {
        this.el.style.display = null; // Ensures that the absolute positioning from hovers is gone
        this.el.style.position = null;
        this.el.style.left = null;
        this.el.style.top = null;
    }

    hide () {
        this.el.style.display = 'none';
        this._closeEl.style.display = 'none';
        this.hideProperties();
        this.hideLayers();

        isPopupOpen = false;
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
            // text = EMPTY_SELECTION_NAME_LABEL;
            this._nameEl.classList.add('map-inspection-name-label-blank');
        }
        else {
            this._nameEl.classList.remove('map-inspection-name-label-blank');
        }
        this._nameEl.textContent = text;
    }

    get name () {
        let text = this._nameEl.textContent;
        return text !== EMPTY_SELECTION_NAME_LABEL ? text : null;
    }

    showProperties (properties) {
        emptyDOMElement(this._propertiesEl);

        // Add section label
        const labelEl = document.createElement('div');
        labelEl.className = 'map-inspection-label';
        labelEl.textContent = 'Properties';

        this._propertiesEl.appendChild(labelEl);

        // Create table element
        const tableWrapperEl = document.createElement('div');
        const tableEl = document.createElement('table');
        const tbodyEl = document.createElement('tbody');

        tableWrapperEl.className = 'map-inspection-properties-table-wrapper';
        tableEl.className = 'map-inspection-properties-table';
        tableEl.appendChild(tbodyEl);

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

            const tr = document.createElement('tr');
            const tdKey = document.createElement('td');
            const tdValue = document.createElement('td');
            tdKey.textContent = key;
            tdValue.textContent = value;
            tr.appendChild(tdKey);
            tr.appendChild(tdValue);

            tbodyEl.appendChild(tr);
        }

        tableWrapperEl.appendChild(tableEl);
        this._propertiesEl.appendChild(tableWrapperEl);

        this._propertiesEl.style.display = 'block';
        // Resets scroll position (we don't want it to remember scroll position of the previous set of properties)
        this._propertiesEl.scrollTop = 0;

        this._closeEl.style.display = 'block';
    }

    hideProperties () {
        emptyDOMElement(this._propertiesEl);
        this._propertiesEl.style.display = 'none';
    }

    showLayers (layers) {
        emptyDOMElement(this._layersEl);

        if (!layers || layers.length === 0) {
            return;
        }

        // Add section label
        const labelEl = document.createElement('div');
        labelEl.className = 'map-inspection-label';
        labelEl.textContent = 'Layers';

        this._layersEl.appendChild(labelEl);

        // Add layer container
        const layerContainerEl = document.createElement('div');
        layerContainerEl.className = 'map-inspection-layers-container';
        this._layersEl.appendChild(layerContainerEl);

        // Create list of layers
        layers.forEach(item => {
            const layerEl = document.createElement('div');
            layerEl.className = 'map-inspection-layer-item';
            layerEl.textContent = item;

            // Layer icon.
            // A class name will be applied later depending on whether
            // it's in the scene or imported
            const iconEl = document.createElement('span');
            iconEl.className = 'map-inspection-layer-icon';
            layerEl.insertBefore(iconEl, layerEl.childNodes[0]);

            const node = TangramPlay.getNodesForAddress('layers:' + item);

            // `node` will be undefined if it is not found in the current scene
            if (node) {
                iconEl.classList.add('icon-layers');

                // Active highlighting
                layerEl.addEventListener('mousedown', event => {
                    // Be sure to destroy all other `active` classes on other layers
                    const layersNodeList = this._layersEl.querySelectorAll('.map-inspection-layer-item');
                    for (var i = 0; i < layersNodeList.length; i++) {
                        layersNodeList[i].classList.remove('active');
                    }
                    layerEl.classList.add('active');
                });
                layerEl.addEventListener('mouseout', event => {
                    layerEl.classList.remove('active');
                });
                layerEl.addEventListener('mouseup', event => {
                    layerEl.classList.remove('active');
                });

                // If node is present, clicking on it should allow scrolling to
                // its position in the editor.
                layerEl.addEventListener('click', event => {
                    // Be sure to destroy all other `selected` classes on other layers
                    const layersNodeList = this._layersEl.querySelectorAll('.map-inspection-layer-item');
                    for (var i = 0; i < layersNodeList.length; i++) {
                        layersNodeList[i].classList.remove('map-inspection-selected');
                    }
                    layerEl.classList.add('map-inspection-selected');

                    // Highlight the block & jump to line.
                    highlightBlock(node);
                });
            }
            else {
                iconEl.classList.add('icon-imported');
            }

            layerContainerEl.appendChild(layerEl);
        });

        this._layersEl.style.display = 'block';
    }

    hideLayers () {
        emptyDOMElement(this._layersEl);
        this._layersEl.style.display = 'none';
    }

    /**
     * Attaches this content to Leaflet's L.popup object. This allows the inspector to
     * be attached to the lat/lng coordinate, so that it is in the right position when the
     * map is panned or zoomed. It also allows the map to be scrolled into place to show
     * the entire popup when it opens.
     */
    showPopup (leafletEvent) {
        const popup = L.popup({
                closeButton: false,
                closeOnClick: false,
                autoPanPadding: [20, 70], // 20 + map toolbar height; TODO: Don't hardcode this.
                offset: [0, -6],
                className: 'map-inspection-popup'
            })
            .setLatLng({ lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng })
            .setContent(this.el)
            .openOn(map);

        // Attach the close listener to the X. This is done at this point when
        // we have a reference to the popup event. We could technically also just
        // rely on the popup's close button, but the thought is that handling our
        // own even here gives us greater control in the future. That said, this can
        // go away if depending on L.popup's internal close button is cleaner.
        this._closeEl.addEventListener('click', event => {
            map.closePopup(popup);
        });

        // Provide an animation in. By itself, the translateZ doesn't mean anything.
        // It's just a "transition from" point. Leaflet adds an animation class
        // which we hook into to provide a Y-position transform from zero.
        popup._container.style.transform = 'translateZ(100px)';

        // Attach a listener to the popup close event to clean up. Note that there
        // can be various ways of closing this popup: the X button, or by clicking
        // elsewhere on the map and opening a new popup.
        map.on('popupclose', onPopupClose);

        // Attach a listener to clean up the popup when a new scene is loaded.
        TangramPlay.on('sceneload', onNewScene);

        function onPopupClose (event) {
            // Leaflet will be responsible for destroying the elements on close.

            // Provide an animation out. Like the transition in, removing the transform
            // style here just provides a "transition to" point. We use the Leaflet
            // popup class to provide the Y-position transform.
            event.popup._container.style.transform = null;
            isPopupOpen = false;

            // Remove highlights. Defers to user-generated highlighting, if any.
            unhighlightAll(true);

            // Clean up events from the map listeners
            map.off('popupclose', onPopupClose);
            TangramPlay.off('sceneload', onNewScene);
        }

        function onNewScene (event) {
            map.closePopup(popup);
        }

        // Record this state
        isPopupOpen = true;
    }
}

// Create an instance only for hovering
const hoverPopup = new TangramInspectionPopup();
hoverPopup.el.className += ' map-inspection-hover';

export function handleInspectionHoverEvent (selection) {
    if (isPopupOpen === true) {
        return;
    }

    // The .feature property does not always exist.
    // For instance, when the map is being dragged, there is no
    // feature being picked. So, make sure it is present.
    if (!selection.feature) {
        hoverPopup.hide();
        return;
    }

    hoverPopup.setLabel(selection.feature.properties);
    hoverPopup.showAt(selection.pixel.x, selection.pixel.y);
}

export function handleInspectionClickEvent (selection) {
    // Don't display a new popup if the click does not return a feature
    // (e.g. interactive: false)
    if (!selection.feature) {
        return;
    }

    // Don't display a new popup if the click is in the same position as the last one
    if (selection.pixel.x === currentPopupX && selection.pixel.y === currentPopupY) {
        return;
    }
    currentPopupX = selection.pixel.x;
    currentPopupY = selection.pixel.y;

    const inspectPopup = new TangramInspectionPopup();

    hoverPopup.hide();

    inspectPopup.resetPosition();
    inspectPopup.setLabel(selection.feature.properties);
    inspectPopup.showProperties(selection.feature.properties);
    inspectPopup.showLayers(selection.feature.layers);
    inspectPopup.showPopup(selection.leaflet_event);
}
