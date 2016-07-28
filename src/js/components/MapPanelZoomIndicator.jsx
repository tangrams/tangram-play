import React from 'react';
import { EventEmitter } from './event-emitter';

import { map } from '../map/map';

export default class MapPanelZoomIndicator extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            zoom: this.props.zoom // Current map zoom position to display
        };
    }

    componentDidMount () {
        // Need to subscribe to map zooming events so that our React component
        // plays nice with the non-React map
        EventEmitter.subscribe('leaflet:zoomend', data => {
            this.setState({ zoom: map.getZoom() });
        });
    }

    formatZoom (zoom) {
        const fractionalNumber = Math.floor(zoom * 10) / 10;
        return Number.parseFloat(fractionalNumber).toFixed(1);
    }

    render () {
        return (
            <div className='map-panel-zoom'>
                z{this.formatZoom(this.state.zoom)}
            </div>
        );
    }
}

MapPanelZoomIndicator.propTypes = {
    zoom: React.PropTypes.number
};
