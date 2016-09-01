import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import MapPanelZoom from './MapPanelZoom';
import MapPanelLocationBar from './MapPanelLocationBar';
import MapPanelBookmarks from './MapPanelBookmarks';

import L from 'leaflet';
import { map } from '../map/map';
import ErrorModal from '../modals/ErrorModal';

/**
 * Represents the main map panel that user can toggle in and out of the leaflet
 * map.
 */
export default class MapPanel extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);
        this.state = {
            open: true, // Whether panel should be open or not
            geolocatorButton: 'bt-map-arrow', // Icon to display for the geolocator button
            geolocateActive: {
                active: 'false'
            } // Whether the geolocate function has been activated
        };

        this._toggleMapPanel = this._toggleMapPanel.bind(this);
        this._clickGeolocator = this._clickGeolocator.bind(this);
        this._onGeolocateSuccess = this._onGeolocateSuccess.bind(this);
    }

    /**
     * Toggle the panel so it is visible or not visible
     */
    _toggleMapPanel () {
        this.setState({ open: !this.state.open });
    }

    /** Geolocator functionality **/

    /**
     * Fired when user clicks on geolocator button
     */
    _clickGeolocator () {
        const geolocator = window.navigator.geolocation;
        const options = {
            enableHighAccuracy: true,
            maximumAge: 10000,
        };

        // Fixes an infinite loop bug with Safari
        // https://stackoverflow.com/questions/27150465/geolocation-api-in-safari-8-and-7-1-keeps-asking-permission/28436277#28436277
        window.setTimeout(() => {
            geolocator.getCurrentPosition(this._onGeolocateSuccess, this._onGeolocateError, options);
        }, 0);

        // Sets a new state for the geolocator button in order to change the
        // type of icon displayed. Sets icon to spin.
        this.setState({ geolocatorButton: 'bt-sync bt-spin active' });
    }

    /**
     * If the geolocator finds a user position succesfully, re-render the map
     * and panel to reflect new position
     * @param position - the new position to which map has moved
     */
    _onGeolocateSuccess (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy || 0;

        // Sets a new state for the geolocator button in order to change the
        // type of icon displayed. Stops the spinning.
        this.setState({ geolocatorButton: 'bt-map-arrow' });

        // Temporarily change state of 'geolocateActive' data so that child
        // component MapPanelSearch can know how to update
        this.setState({
            geolocateActive: {
                active: 'true',
                latlng: {lat: latitude, lng: longitude}
            }
        });
        this.setState({
            geolocateActive: {
                active: 'false'
            }
        });

        let originalZoom = map.getZoom();
        let desiredZoom = originalZoom;

        // Only zoom to a radius if the accuracy is actually a number or present
        if (accuracy) {
            // The circle needs to be added to the map in order for .getBounds() to work
            let circle = L.circle([latitude, longitude], accuracy).addTo(map);
            let bounds = circle.getBounds();

            // Fit view to the accuracy diameter
            map.fitBounds(bounds);

            // If the new zoom level is within a +/- 1 range of the original
            // zoom level, keep it the same
            let newZoom = map.getZoom();
            desiredZoom = (newZoom >= originalZoom - 1 && newZoom <= originalZoom + 1)
                ? originalZoom : newZoom;

            // Clean up
            circle.remove();
        }
        else {
            // Zoom in a bit only if user's view is very zoomed out
            desiredZoom = (originalZoom < 16) ? 16 : originalZoom;
        }

        map.setZoom(desiredZoom);
    }


    /**
     * Handles geolocation error. Reports a user friendly error message
     * if PositionError has provided the reason why it did not work.
     *
     * @param {PositionError} err - a PositionError object representing the
     *      reason for the geolocation failure. It contains an error code
     *      and a user-agent defined message. See also:
     *      see https://developer.mozilla.org/en-US/docs/Web/API/PositionError
     */
    _onGeolocateError (err) {
        let message = 'Your current position is unavailable, and we could not determine why.';

        // On Chrome 50, a specific error message (with code 1) indicates that
        // permission to geolocate was denied due to an insecure origin. This
        // may happen if Tangram Play is loaded over http, rather than https.
        // The only way to distinguish this between other uses of error code 1
        // is via the error message text. See also:
        // https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
        // Note this comment from that page: "This can be quite brittle as it
        // might change in the future, but a strong signal that it was a
        // non-secure content issue is to look for the string “Only secure
        // origins are allowed”."
        if (err.message.indexOf('Only secure origins are allowed') === 0) {
            message = 'Your current position is unavailable in this browser because Tangram Play wasn’t loaded over a secure URL.';
        }
        else {
            switch (err.code) {
                case 1: // PERMISSION_DENIED
                    message = 'Your current position is unavailable because the browser denied our request for it. It may be disabled in your browser settings.';
                    break;
                case 2: // POSITION_UNAVAILABLE
                    message = 'Your current position is unavailable because the browser reported an internal error.';
                    break;
                case 3: // TIMEOUT
                    message = 'Your current position is unavailable because we asked for it and got no response.';
                    break;
                default:
                    break;
            }
        }

        ReactDOM.render(<ErrorModal error={message} />, document.getElementById('modal-container'));
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        return (
            <div className="map-panel">
                {/* Toggle map panel to show it*/}
                <OverlayTrigger
                    rootClose
                    placement="bottom"
                    overlay={<Tooltip id="tooltip">Toogle map toolbar</Tooltip>}
                >
                    <Button onClick={this._toggleMapPanel} className="map-panel-button-show">
                        <Icon type="bt-caret-down" />
                    </Button>
                </OverlayTrigger>

                {/* Map panel*/}
                <Panel collapsible expanded={this.state.open} className="map-panel-collapsible">
                    <div className="map-panel-toolbar">
                        <MapPanelZoom />

                        {/* Search buttons*/}
                        <div className="map-panel-search-bookmarks">
                            <MapPanelLocationBar geolocateActive={this.state.geolocateActive} />
                            <MapPanelBookmarks />
                        </div>

                        {/* Locate me button*/}
                        <ButtonGroup className="buttons-locate">
                            <OverlayTrigger
                                rootClose
                                placement="bottom"
                                overlay={<Tooltip id="tooltip">Locate me</Tooltip>}
                            >
                                <Button onClick={this._clickGeolocator}>
                                    <Icon type={this.state.geolocatorButton} />
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Toggle map panel to show it*/}
                        <ButtonGroup className="buttons-toggle">
                            <OverlayTrigger
                                rootClose
                                placement="bottom"
                                overlay={<Tooltip id="tooltip">Toggle map toolbar</Tooltip>}
                            >
                                <Button onClick={this._toggleMapPanel}>
                                    <Icon type="bt-caret-up" />
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>
                    </div>
                </Panel>
            </div>
        );
    }
}
