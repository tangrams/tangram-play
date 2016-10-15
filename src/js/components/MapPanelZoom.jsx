import React from 'react';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import IconButton from './IconButton';
import { map } from '../map/map';
import EventEmitter from './event-emitter';

function formatZoom(zoom) {
    const fractionalNumber = Math.floor(zoom * 10) / 10;
    return Number.parseFloat(fractionalNumber).toFixed(1);
}

export default class MapPanelZoom extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor(props) {
        super(props);

        this.state = {
            zoom: 0, // Current map zoom position to display
        };

        this.onClickZoomIn = this.onClickZoomIn.bind(this);
        this.onClickZoomOut = this.onClickZoomOut.bind(this);
    }

    componentDidMount() {
        EventEmitter.subscribe('map:init', () => {
            this.setState({ zoom: map.getZoom() });
        });

        // Need to subscribe to map zooming events so that our React component
        // plays nice with the non-React map
        EventEmitter.subscribe('leaflet:zoomend', (data) => {
            this.setState({ zoom: map.getZoom() });
        });
    }

    /** Zoom functionality **/

    /**
     * Zoom into the map when user clicks ZoomIn button
     */
    onClickZoomIn(event) {
        // Not a documented feature, but shift-clicking will zoom in and
        // round that zoom to the nearest integer.
        if (event.shiftKey) {
            const currentZoom = map.getZoom();
            map.setZoom(Math.floor(currentZoom + 1), { animate: true });
        } else {
            map.zoomIn(1, { animate: true });
        }

        this.setState({ zoom: map.getZoom() });
    }

    /**
     * Zoom into the map when user clicks ZoomOut button
     */
    onClickZoomOut(event) {
        // Not a documented feature, but shift-clicking will zoom out and
        // round that zoom to the nearest integer.
        if (event.shiftKey) {
            const currentZoom = map.getZoom();
            map.setZoom(Math.ceil(currentZoom - 1), { animate: true });
        } else {
            map.zoomOut(1, { animate: true });
        }

        this.setState({ zoom: map.getZoom() });
    }

    render() {
        return (
            <div className="map-panel-zoom-container">
                <div className="map-panel-zoom">
                    z{formatZoom(this.state.zoom)}
                </div>

                {/* Zoom buttons */}
                <ButtonGroup className="buttons-plusminus">
                    <IconButton
                        icon="bt-plus"
                        tooltip="Zoom in"
                        className="map-panel-zoomin"
                        onClick={this.onClickZoomIn}
                    />
                    <IconButton
                        icon="bt-minus"
                        tooltip="Zoom out"
                        className="map-panel-zoomout"
                        onClick={this.onClickZoomOut}
                    />
                </ButtonGroup>
            </div>
        );
    }
}
