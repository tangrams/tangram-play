import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './icon.react';
import MapPanelSearch from './map-panel-search-bookmarks.react';

import { map } from '../map/map';
import ErrorModal from '../modals/modal.error';
// Required event dispatch and subscription for now while parts of app are React components and others are not
import { EventEmitter } from './event-emittor';

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
            zoom: map.getZoom(), // Current map zoom position to display
            geolocatorButton: 'bt-map-arrow', // Icon to display for the geolocator button
            geolocateActive: {
                active: 'false'
            } // Whether the geolocate function has been activated
        };

        this.toggleMapPanel = this.toggleMapPanel.bind(this);
        this.clickGeolocator = this.clickGeolocator.bind(this);
        this.onGeolocateSuccess = this.onGeolocateSuccess.bind(this);
        this.clickZoomIn = this.clickZoomIn.bind(this);
        this.clickZoomOut = this.clickZoomOut.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * Temporary requirement is to subscribe to events from map becuase it is
     * not a React component
     */
    componentDidMount () {
        let that = this;
        // Need to subscribe to map zooming events so that our React component plays nice with the non-React map
        EventEmitter.subscribe('zoomend', function (data) { that.setZoomLabel(); });
    }

    /**
     * Toggle the panel so it is visible or not visible
     */
    toggleMapPanel () {
        this.setState({ open: !this.state.open });
    }

    /** Zoom functionality **/

    /**
     * Zoom into the map when user click ZoomOut button
     */
    setZoomLabel () {
        let currentZoom = map.getZoom();
        let fractionalNumber = Math.floor(currentZoom * 10) / 10;
        this.setState({ zoom: fractionalNumber.toFixed(1) });
    }

    /**
     * Zoom into the map when user click ZoomIn button
     */
    clickZoomIn () {
        map.zoomIn(1, { animate: true });
        this.setZoomLabel();
    }

    /**
     * Zoom into the map when user click ZoomOut button
     */
    clickZoomOut () {
        map.zoomOut(1, { animate: true });
        this.setZoomLabel();
    }

    /** Geolocator functionality **/

    /**
     * Fired when user clicks on geolocator button
     */
    clickGeolocator () {
        const geolocator = window.navigator.geolocation;
        const options = {
            enableHighAccuracy: true,
            maximumAge: 10000,
        };

        // Fixes an infinite loop bug with Safari
        // https://stackoverflow.com/questions/27150465/geolocation-api-in-safari-8-and-7-1-keeps-asking-permission/28436277#28436277
        window.setTimeout(() => {
            geolocator.getCurrentPosition(this.onGeolocateSuccess, this.onGeolocateError, options);
        }, 0);

        // Sets a new state for the geolocator button in order to change the
        // type of icon displayed. Sets icon to spin.
        this.setState({ geolocatorButton: 'bt-sync bt-spin' });
    }

    /**
     * If the geolocator finds a user position succesfully, re-render the map
     * and panel to reflect new position
     * @param position - the new position to which map has moved
     */
    onGeolocateSuccess (position) {
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
     * @param {PositionError} err - a PositionError object representing the
     *      reason for the geolocation failure. It contains an error code
     *      and a user-agent defined message. See also:
     *      see https://developer.mozilla.org/en-US/docs/Web/API/PositionError
     */
    onGeolocateError (err) {
        let message = 'Tangram Play could not retrieve your current position and we do not have enough information to know why.';
        switch (err.code) {
            case 1: // PERMISSION_DENIED
                message = 'Tangram Play could not retrieve your current position because we do not have permission to use your browser’s geolocation feature. To get your current location, please turn it back on in your browser settings.';
                break;
            case 2: // POSITION_UNAVAILABLE
                message = 'Tangram Play could not retrieve your current position because your browser’s geolocation feature reported an internal error.';
                break;
            case 3: // TIMEOUT
                message = 'Tangram Play could not retrieve your current position because your browser’s geolocation feature did not respond.';
                break;
            default:
                break;
        }
        const modal = new ErrorModal({ message });
        modal.show();
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        return (
            <div>
                {/* Toggle map panel to show it*/}
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Toogle map toolbar'}</Tooltip>}>
                    <Button onClick={this.toggleMapPanel} className='map-panel-button-show'>
                        <Icon type={'bt-caret-down'} />
                    </Button>
                </OverlayTrigger>

                {/* Map panel*/}
                <Panel collapsible expanded={this.state.open} className='map-panel-collapsible'>
                    <div className='map-panel-toolbar'>
                        <div><span>z{this.state.zoom}</span></div>

                        {/* Zoom buttons*/}
                        <ButtonGroup id='buttons-plusminus'>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom in'}</Tooltip>}>
                                <Button onClick={this.clickZoomIn}> <Icon type={'bt-plus'} /> </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom out'}</Tooltip>}>
                                <Button onClick={this.clickZoomOut}> <Icon type={'bt-minus'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Search buttons*/}
                        <MapPanelSearch geolocateActive={this.state.geolocateActive}/>

                        {/* Locate me button*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Locate me'}</Tooltip>}>
                                <Button onClick={this.clickGeolocator}> <Icon type={this.state.geolocatorButton} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Toggle map panel to show it*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Toggle map toolbar'}</Tooltip>}>
                                <Button onClick={this.toggleMapPanel}> <Icon type={'bt-caret-up'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>
                    </div>
                </Panel>
            </div>
        );
    }
}
