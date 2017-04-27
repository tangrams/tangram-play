/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// TODO: Separate out; make JSX files
import { upperFirst } from 'lodash';
import L from 'leaflet';
import React from 'react';
import ReactDOM from 'react-dom';
import { map, tangramLayer } from './map';
import { editor } from '../editor/editor';
import { getNodeAtKeyAddress } from '../editor/yaml-ast';
import { highlightNode } from '../editor/highlight';
import EventEmitter from '../components/event-emitter';

// Magic numbers
// TODO: don't hardcode
// Vertical offset (positive direction moves tooltip upwards) of tooltip from mouse cursor
const TOOLTIP_OFFSET_Y = 24;

// If the map pans to fit the popup in the viewport, add this much margin around it
const POPUP_MARGIN = 12;

// Additional Y margin above the popup to account for the map panel height
const POPUP_OFFSET_Y = 44;

let mountNode;
let isPopupOpen = false;
let currentPopupX;
let currentPopupY;
let globalIntrospectionState = false;

// We use this to find the mountpoint and cache it so future calls we return
// it directly. TODO: Something else?
function getMountNode() {
  if (!mountNode) {
    mountNode = document.getElementById('map-inspection-components');
  }

  return mountNode;
}

// This is shared between the hover and the popup
class TangramInspectionHeader extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  determineKindValue(properties) {
    // Kind is usually present on properties in Mapzen vector tile service.
    // (For more info: https://mapzen.com/documentation/vector-tiles/layers/)
    if (properties.kind_detail) {
      return `${properties.kind} (${upperFirst(properties.kind_detail)})`;
    } else if (properties.kind) {
      return properties.kind;
    } else if (properties.land) {
      // Sometimes there's no kind value but a key-value of "land: 'base'" (are there other values?)
      return 'land';
    }

    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  formatKindValue(text) {
    let formattedText;

    if (typeof text === 'string') {
      formattedText = text.replace(/_/g, ' ');
      formattedText = upperFirst(formattedText);
    } else {
      formattedText = '';
    }

    return formattedText;
  }

  // eslint-disable-next-line class-methods-use-this
  determineFeatureName(properties) {
    if (properties.name) {
      return properties.name;
    } else if (properties.route_name) {
      return properties.route_name;
    } else if (properties.land) {
      return properties.land;
    } else if (properties.addr_housenumber && properties.addr_street) {
      return `${properties.addr_housenumber} ${properties.addr_street}`;
    }

    return null;
  }

  render() {
    const properties = this.props.feature.properties;
    const kind = this.formatKindValue(this.determineKindValue(properties));
    const name = this.determineFeatureName(properties);
    const UNKNOWN_LABEL = 'Unknown feature';

    return (
      <div className="map-inspection-header">
        <div className="map-inspection-header-label">{name || kind || UNKNOWN_LABEL}</div>
        {(() => {
          // Only render this part if the feature properties have provided
          // a name AND a `kind` property (Mapzen vector tiles).
          if (name && kind) {
            return <div className="map-inspection-header-sublabel">{kind}</div>;
          }
          return null;
        })()}
      </div>
    );
  }
}

TangramInspectionHeader.propTypes = {
  feature: React.PropTypes.shape({
    properties: React.PropTypes.object,
  }).isRequired,
};

class TangramInspectionHover extends React.Component {
  constructor(props) {
    super(props);

    this.position = this.applyHoverPosition.bind(this);
  }

  componentDidUpdate() {
    // Put the component in the right place, if rendered. Some conditions
    // may prevent rendering; see the render() function.
    if (this.el) {
      this.applyHoverPosition();
    }
  }

  applyHoverPosition() {
    const rect = this.el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const pixelX = this.props.selection.pixel.x;
    const pixelY = this.props.selection.pixel.y;

    this.el.style.left = `${pixelX - (width / 2)}px`;
    this.el.style.top = `${pixelY - height - TOOLTIP_OFFSET_Y}px`;
  }

  render() {
    // The .feature property does not always exist. For instance, when
    // the map is being dragged, there is no feature being picked. In this
    // case we do not render the component.
    if (!this.props.selection.feature) {
      return null;
    }

    return (
      <div
        className="map-inspection map-inspection-hover"
        ref={(el) => { this.el = el; }}
      >
        <TangramInspectionHeader feature={this.props.selection.feature} />
      </div>
    );
  }
}

TangramInspectionHover.propTypes = {
  selection: React.PropTypes.shape({
    feature: React.PropTypes.object,
    pixel: React.PropTypes.object,
  }).isRequired,
};

class TangramInspectionPopup extends React.Component {
  constructor(props) {
    super(props);

    this.onMouseDownLayer = this.onMouseDownLayer.bind(this);
    this.onClickLayer = this.onClickLayer.bind(this);
    this.onClickClose = this.onClickClose.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  onClickSourceName(event) {
    const name = event.currentTarget.dataset.sourceName;
    const node = getNodeAtKeyAddress(editor.getDoc().yamlNodes, `sources:${name}`);
    highlightNode(node);
  }

  // Active highlighting
  onMouseDownLayer(event) {
    // Be sure to destroy all other `active` classes on other layers
    const layersNodeList = this.layersEl.querySelectorAll('.map-inspection-layer-item');
    for (let i = 0; i < layersNodeList.length; i++) {
      layersNodeList[i].classList.remove('active');
    }
    event.target.classList.add('active');
  }

  // eslint-disable-next-line class-methods-use-this
  onMouseOutLayer(event) {
    event.target.classList.remove('active');
  }

  // eslint-disable-next-line class-methods-use-this
  onMouseUpLayer(event) {
    event.target.classList.remove('active');
  }

  // If node is present, clicking on it should allow scrolling to
  // its position in the editor.
  onClickLayer(event) {
    // Be sure to destroy all other `selected` classes on other layers
    const layersNodeList = this.layersEl.querySelectorAll('.map-inspection-layer-item');
    for (let i = 0; i < layersNodeList.length; i++) {
      layersNodeList[i].classList.remove('map-inspection-selected');
    }
    event.target.classList.add('map-inspection-selected');

    // Highlight the block & jump to line.
    const node = getNodeAtKeyAddress(editor.getDoc().yamlNodes, event.currentTarget.dataset.nodeAddress);
    highlightNode(node);
  }

  // eslint-disable-next-line class-methods-use-this
  onClickClose(event) {
    map.closePopup();
  }

  // eslint-disable-next-line class-methods-use-this
  sortFeatureProperties(properties) {
    const sorted = [];
    Object.keys(properties)
      .sort()
      .forEach((v, i) => {
        sorted.push([v, properties[v]]);
      });

    return sorted;
  }

  render() {
    if (!this.props.selection.feature) {
      return null;
    }
    const sortedProperties = this.sortFeatureProperties(this.props.selection.feature.properties);
    const layers = this.props.selection.feature.layers;

    return (
      <div className="map-inspection" ref={(el) => { this.el = el; }}>
        <TangramInspectionHeader feature={this.props.selection.feature} />
        <div className="map-inspection-source">
          <div className="map-inspection-label">Data source</div>
          <div className="map-inspection-properties-table-wrapper">
            <table className="map-inspection-properties-table">
              <tbody>
                <tr
                  onClick={this.onClickSourceName}
                  data-source-name={this.props.selection.feature.source_name}
                >
                  <td className="map-inspection-source-item-label">Name</td>
                  <td>{this.props.selection.feature.source_name}</td>
                </tr>
                {(() => {
                  // Not all data sources will have multiple layers.
                  // For instance, https://tile.mapzen.com/mapzen/vector/earth/{z}/{x}/{y}.topojson
                  // is just the earth layer. In this situation, the
                  // `selection.feature` object reported by Tangram
                  // does not contain a `source_layer` property.
                  if (this.props.selection.feature.source_layer) {
                    return (
                      <tr>
                        <td className="map-inspection-source-item-label">Layer</td>
                        <td>{this.props.selection.feature.source_layer}</td>
                      </tr>
                    );
                  }
                  return null;
                })()}
                <tr>
                  <td className="map-inspection-source-item-label">Tile</td>
                  <td>{this.props.selection.feature.tile.coords.key}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="map-inspection-properties">
          <div className="map-inspection-label">Properties</div>
          <div className="map-inspection-properties-table-wrapper">
            <table className="map-inspection-properties-table">
              <tbody>
                {sortedProperties.map((item) => {
                  const key = item[0];
                  // Cast value to a string, especially for
                  // true/false values, which are stored as Booleans
                  // and will be mistakenly evaluated as an expression
                  // rather than displayed as a string.
                  const value = String(item[1]);

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
        <div className="map-inspection-layers">
          <div className="map-inspection-label">Layers</div>
          <div className="map-inspection-layers-container" ref={(el) => { this.layersEl = el; }}>
            {layers.map((item) => {
              const address = `layers:${item}`;
              const node = getNodeAtKeyAddress(editor.getDoc().yamlNodes, address);

              if (node) {
                return (
                  <div
                    className="map-inspection-layer-item"
                    key={item}
                    onMouseDown={this.onMouseDownLayer}
                    onMouseOut={this.onMouseOutLayer}
                    onMouseUp={this.onMouseUpLayer}
                    onClick={this.onClickLayer}
                    data-node-address={address}
                  >
                    <span className="map-inspection-layer-icon icon-layers" />
                    {item}
                  </div>
                );
              }

              return (
                <div className="map-inspection-layer-item" key={item}>
                  <span className="map-inspection-layer-icon icon-imported" />
                  {item}
                </div>
              );
            })}
          </div>
        </div>
        <div className="map-inspection-close" onClick={this.onClickClose}>×</div>
      </div>
    );
  }
}

TangramInspectionPopup.propTypes = {
  selection: React.PropTypes.shape({
    feature: React.PropTypes.object,
  }).isRequired,
};

/**
 * Attaches this content to Leaflet's L.popup object. This allows the inspector to
 * be attached to the lat/lng coordinate, so that it is in the right position when the
 * map is panned or zoomed. It also allows the map to be scrolled into place to show
 * the entire popup when it opens.
 */
function showPopup(selection) {
  const leafletEvent = selection.leaflet_event;
  const popup = L.popup({
    closeButton: false,
    closeOnClick: false,
    autoPanPadding: [POPUP_MARGIN, POPUP_MARGIN + POPUP_OFFSET_Y],
    offset: [0, -5],
    className: 'map-inspection-popup',
  });

  // This is just a placeholder div to mount into. This placeholder div is
  // attached to the Leaflet popup.
  const el = document.createElement('div');
  ReactDOM.render(<TangramInspectionPopup selection={selection} />, el);

  popup
    .setContent(el)
    .setLatLng({ lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng })
    .openOn(map);

  function onNewScene(event) {
    map.closePopup(popup);
  }

  function onPopupClose(event) {
    // Leaflet will be responsible for destroying the elements on close.
    isPopupOpen = false;

    // Clean up React DOM
    window.setTimeout(() => {
      ReactDOM.unmountComponentAtNode(el);
    }, 100);

    // Clean up events from the map listeners
    map.off('popupclose', onPopupClose);
    EventEmitter.unsubscribe('tangram:sceneload', onNewScene);
  }

  // Attach a listener to the popup close event to clean up. Note that there
  // can be various ways of closing this popup: the X button, or by clicking
  // elsewhere on the map and opening a new popup.
  map.on('popupclose', onPopupClose);

  // Attach a listener to clean up the popup when a new scene is loaded.
  EventEmitter.subscribe('tangram:sceneload', onNewScene);

  // Record this state
  isPopupOpen = true;
}

export function handleInspectionHoverEvent(selection) {
  // Do not show when global introspection is off, or if the
  // full popup is open already.
  if (globalIntrospectionState === false || isPopupOpen === true) {
    return;
  }

  ReactDOM.render(<TangramInspectionHover selection={selection} />, getMountNode());
}

export function handleInspectionClickEvent(selection) {
  // Only show popups when global introspection mode is on.
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
 * Turns on global introspection mode for Tangram.
 *
 * @public
 * @param {Boolean} - when `true`, the interactive flag is turned on for all
 *          geometry. when `false`, interactivity defers to scene file rules.
 */
export function setGlobalIntrospection(boolean) {
  tangramLayer.scene.setIntrospection(boolean);
  globalIntrospectionState = boolean;

  // Turn mouse cursor into a crosshair when on the map
  if (boolean === true) {
    map.getContainer().classList.add('map-crosshair');
  } else {
    map.getContainer().classList.remove('map-crosshair');

    // Cleanup
    map.closePopup();
    ReactDOM.unmountComponentAtNode(getMountNode());
  }
}
