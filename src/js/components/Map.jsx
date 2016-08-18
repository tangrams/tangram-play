import React from 'react';
import MapPanel from './MapPanel';
import MapLoading from '../map/loading';
import { initMap } from '../map/map';
import { EventEmitter } from './event-emitter';

export default class Map extends React.Component {
    componentDidMount () {
        // We have to run initMap here because this instantiates Leaflet
        // into a map container, which expects the DOM element for it to
        // exist already. So we can only call it during this lifecycle method.
        initMap();

        // The problem is that the other map-based sub-components like MapPanel
        // cannot assume that the map exists already when they're mounted,
        // because the children of this component will be mounted before
        // the parent's componentDidMount() is called. So, like all other
        // inter-component communication outside of the React framework, we
        // currently use an EventEmitter to report a ready state, which then
        // populates the sub-components' state. I'd imagine this situation to
        // improve when we look into a react-leaflet implementation.
        EventEmitter.dispatch('map:init');
    }

    render () {
        return (
            <div className='map-container' id='map-container'>
                <div className='map-view' id='map' />
                <MapLoading />
                <MapPanel />
                <div id='map-inspection-components' />
            </div>
        );
    }
}
