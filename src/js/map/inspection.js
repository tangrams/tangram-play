import { capitalize } from 'lodash';
import L from 'leaflet';
import React from 'react';
import ReactDOM from 'react-dom';
import { map, tangramLayer } from './map';
import { getNodesForAddress } from '../editor/editor';
import { highlightBlock } from '../editor/highlight';
import { EventEmitter } from '../components/event-emitter';

let mountNode;

let isPopupOpen = false;
let currentPopupX, currentPopupY;
let globalIntrospectionState = false;

// We use this to find the mountpoint and cache it so future calls we return
// it directly. TODO: Something else?
function getMountNode () {
    if (!mountNode) {
        mountNode = document.getElementById('map-inspection-components');
    }

    return mountNode;
}

// This is shared between the hover and the popup
class TangramInspectionHeader extends React.Component {
    determineKindValue (properties) {
        // Kind is usually present on properties in Mapzen vector tile service.
        // (For more info: https://mapzen.com/documentation/vector-tiles/layers/)
        if (properties.kind) {
            return properties.kind;
        }
        // Sometimes there's no kind value but a key-value of "land: 'base'" (are there other values?)
        else if (properties.land) {
            return 'land';
        }
    }

    formatKindValue (text) {
        if (typeof text === 'string') {
            text = text.replace(/_/g, ' ');
            text = capitalize(text);
        }
        else {
            text = '';
        }

        return text;
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

    render () {
        const properties = this.props.feature.properties;
        const kind = this.formatKindValue(this.determineKindValue(properties));
        const name = this.determineFeatureName(properties);
        const UNKNOWN_LABEL = 'Unknown feature';

        return (
            <div className='map-inspection-header'>
                <div className='map-inspection-header-label'>{name || kind || UNKNOWN_LABEL}</div>
                {(() => {
                    // Only render this part if the feature properties have provided
                    // a name AND a `kind` property (Mapzen vector tiles).
                    if (name && kind) {
                        return <div className='map-inspection-header-sublabel'>{kind}</div>;
                    }
                })()}
            </div>
        );
    }
}

TangramInspectionHeader.propTypes = {
    feature: React.PropTypes.object
};

class TangramInspectionHover extends React.Component {
    constructor (props) {
        super(props);

        this.position = this.applyHoverPosition.bind(this);
    }

    componentDidUpdate () {
        // Put the component in the right place, if rendered. Some conditions
        // may prevent rendering; see the render() function.
        if (this._el) {
            this.applyHoverPosition();
        }
    }

    applyHoverPosition () {
        const rect = this._el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const pixelX = this.props.selection.pixel.x;
        const pixelY = this.props.selection.pixel.y;

        // TODO: don't hardcode magic number
        const offsetY = 24;

        this._el.style.left = (pixelX - width / 2) + 'px';
        this._el.style.top = (pixelY - height - offsetY) + 'px';
    }

    render () {
        // The .feature property does not always exist. For instance, when
        // the map is being dragged, there is no feature being picked. In this
        // case we do not render the component.
        if (!this.props.selection.feature) {
            return null;
        }
        else {
            return (
                <div className='map-inspection map-inspection-hover' ref={(el) => { this._el = el; }}>
                    <TangramInspectionHeader feature={this.props.selection.feature} />
                </div>
            );
        }
    }
}

TangramInspectionHover.propTypes = {
    selection: React.PropTypes.object
};

class TangramInspectionPopup extends React.Component {
    constructor (props) {
        super(props);

        this.onMouseDownLayer = this.onMouseDownLayer.bind(this);
        this.onClickLayer = this.onClickLayer.bind(this);
        this.onClickClose = this.onClickClose.bind(this);
    }

    onClickSourceName (event) {
        const name = event.currentTarget.dataset.sourceName;
        const node = getNodesForAddress('sources:' + name);
        if (node) {
            highlightBlock(node);
        }
    }

    // Active highlighting
    onMouseDownLayer (event) {
        // Be sure to destroy all other `active` classes on other layers
        const layersNodeList = this._layersEl.querySelectorAll('.map-inspection-layer-item');
        for (var i = 0; i < layersNodeList.length; i++) {
            layersNodeList[i].classList.remove('active');
        }
        event.target.classList.add('active');
    }

    onMouseOutLayer (event) {
        event.target.classList.remove('active');
    }

    onMouseUpLayer (event) {
        event.target.classList.remove('active');
    }

    // If node is present, clicking on it should allow scrolling to
    // its position in the editor.
    onClickLayer (event) {
        // Be sure to destroy all other `selected` classes on other layers
        const layersNodeList = this._layersEl.querySelectorAll('.map-inspection-layer-item');
        for (var i = 0; i < layersNodeList.length; i++) {
            layersNodeList[i].classList.remove('map-inspection-selected');
        }
        event.target.classList.add('map-inspection-selected');

        // Highlight the block & jump to line.
        const node = getNodesForAddress(event.currentTarget.dataset.nodeAddress);
        highlightBlock(node);
    }

    onClickClose (event) {
        map.closePopup();
    }

    sortFeatureProperties (properties) {
        let sorted = [];
        Object.keys(properties)
            .sort()
            .forEach(function (v, i) {
                sorted.push([v, properties[v]]);
            });

        return sorted;
    }

    render () {
        if (!this.props.selection.feature) {
            return null;
        }
        else {
            const sortedProperties = this.sortFeatureProperties(this.props.selection.feature.properties);
            const layers = this.props.selection.feature.layers;

            return (
                <div className='map-inspection' ref={(el) => { this._el = el; }}>
                    <TangramInspectionHeader feature={this.props.selection.feature} />
                    <div className='map-inspection-source'>
                        <div className='map-inspection-label'>Data source</div>
                        <div className='map-inspection-properties-table-wrapper'>
                            <table className='map-inspection-properties-table'>
                                <tbody>
                                    <tr
                                        onClick={this.onClickSourceName}
                                        data-source-name={this.props.selection.feature.source_name}
                                    >
                                        <td className='map-inspection-source-item-label'>Name</td>
                                        <td>{this.props.selection.feature.source_name}</td>
                                    </tr>
                                    {(() => {
                                        // Not all data sources will have multiple layers.
                                        // For instance, https://vector.mapzen.com/osm/earth/{z}/{x}/{y}.topojson
                                        // is just the earth layer. In this situation, the
                                        // `selection.feature` object reported by Tangram
                                        // does not contain a `source_layer` property.
                                        if (this.props.selection.feature.source_layer) {
                                            return (
                                                <tr>
                                                    <td className='map-inspection-source-item-label'>Layer</td>
                                                    <td>{this.props.selection.feature.source_layer}</td>
                                                </tr>
                                            );
                                        }
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className='map-inspection-properties'>
                        <div className='map-inspection-label'>Properties</div>
                        <div className='map-inspection-properties-table-wrapper'>
                            <table className='map-inspection-properties-table'>
                                <tbody>
                                    {sortedProperties.map((item) => {
                                        const key = item[0];
                                        const value = item[1];

                                        return (
                                            <tr key={key}>
                                                <td>{key}</td>
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className='map-inspection-layers'>
                        <div className='map-inspection-label'>Layers</div>
                        <div className='map-inspection-layers-container' ref={(el) => { this._layersEl = el; }}>
                            {layers.map((item) => {
                                const address = `layers:${item}`;
                                const node = getNodesForAddress(address);

                                if (node) {
                                    return (
                                        <div
                                            className='map-inspection-layer-item'
                                            key={item}
                                            onMouseDown={this.onMouseDownLayer}
                                            onMouseOut={this.onMouseOutLayer}
                                            onMouseUp={this.onMouseUpLayer}
                                            onClick={this.onClickLayer}
                                            data-node-address={address}
                                        >
                                            <span className='map-inspection-layer-icon icon-layers'></span>
                                            {item}
                                        </div>
                                    );
                                }
                                else {
                                    return (
                                        <div className='map-inspection-layer-item' key={item}>
                                            <span className='map-inspection-layer-icon icon-imported'></span>
                                            {item}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                    <div className='map-inspection-close' onClick={this.onClickClose}>×</div>
                </div>
            );
        }
    }
}

TangramInspectionPopup.propTypes = {
    selection: React.PropTypes.object
};

export function handleInspectionHoverEvent (selection) {
    // Do not show when global introspection is off, or if the
    // full popup is open already.
    if (globalIntrospectionState === false || isPopupOpen === true) {
        return;
    }

    ReactDOM.render(<TangramInspectionHover selection={selection} />, getMountNode());
}

export function handleInspectionClickEvent (selection) {
    // Experiment: only show popups when global introspection is on.
    if (globalIntrospectionState === false) {
        return;
    }

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

    // Hides a hover popup, if any
    ReactDOM.unmountComponentAtNode(getMountNode());

    // Mounts the inspection popup into a Leaflet popup element
    showPopup(selection);
}

/**
 * Attaches this content to Leaflet's L.popup object. This allows the inspector to
 * be attached to the lat/lng coordinate, so that it is in the right position when the
 * map is panned or zoomed. It also allows the map to be scrolled into place to show
 * the entire popup when it opens.
 */
function showPopup (selection) {
    const leafletEvent = selection.leaflet_event;
    const popup = L.popup({
        closeButton: false,
        closeOnClick: false,
        autoPanPadding: [20, 70], // 20 + map toolbar height; TODO: Don't hardcode this.
        offset: [0, -6],
        className: 'map-inspection-popup'
    });

    // This is just a placeholder div to mount into. This placeholder div is
    // attached to the Leaflet popup.
    const el = document.createElement('div');
    ReactDOM.render(<TangramInspectionPopup selection={selection} />, el);

    popup
        .setLatLng({ lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng })
        .setContent(el)
        .openOn(map);

    // Provide an animation in. By itself, the translateZ doesn't mean anything.
    // It's just a "transition from" point. Leaflet adds an animation class
    // which we hook into to provide a Y-position transform from zero.
    popup._container.style.transform = 'translateZ(100px)';

    // Attach a listener to the popup close event to clean up. Note that there
    // can be various ways of closing this popup: the X button, or by clicking
    // elsewhere on the map and opening a new popup.
    map.on('popupclose', onPopupClose);

    // Attach a listener to clean up the popup when a new scene is loaded.
    EventEmitter.subscribe('tangram:sceneload', onNewScene);

    function onPopupClose (event) {
        // Leaflet will be responsible for destroying the elements on close.

        // Provide an animation out. Like the transition in, removing the transform
        // style here just provides a "transition to" point. We use the Leaflet
        // popup class to provide the Y-position transform.
        event.popup._container.style.transform = null;
        isPopupOpen = false;

        // Clean up React DOM
        // NOTE we should just something like ReactTransitionGroup to handle
        // the appropriate timing after animation is over.
        window.setTimeout(() => {
            ReactDOM.unmountComponentAtNode(el);
        }, 120);

        // Clean up events from the map listeners
        map.off('popupclose', onPopupClose);
        EventEmitter.unsubscribe('tangram:sceneload', onNewScene);
    }

    function onNewScene (event) {
        map.closePopup(popup);
    }

    // Record this state
    isPopupOpen = true;
}

/**
 * Turns on global introspection mode for Tangram.
 *
 * @public
 * @param {Boolean} - when `true`, the interactive flag is turned on for all
 *          geometry. when `false`, interactivity defers to scene file rules.
 */
export function setGlobalIntrospection (boolean) {
    tangramLayer.scene.setIntrospection(boolean);
    globalIntrospectionState = boolean;

    // Turn mouse cursor into a crosshair when on the map
    if (boolean === true) {
        map.getContainer().classList.add('map-crosshair');
    }
    else {
        map.getContainer().classList.remove('map-crosshair');

        // Cleanup
        map.closePopup();
        ReactDOM.unmountComponentAtNode(getMountNode());
    }
}
