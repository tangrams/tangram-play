import React from 'react';
import MapPanel from './MapPanel';
import MapLoading from '../map/MapLoading';
import { initMap } from '../map/map';

export default class Map extends React.Component {
    componentDidMount() {
        // We have to run initMap here because this instantiates Leaflet
        // into a map container, which expects the DOM element for it to
        // exist already. So we can only call it during this lifecycle method.
        initMap();
    }

    render() {
        return (
            <div className="map-container" id="map-container">
                <div className="map-view" id="map" />
                <MapLoading />
                {(() => {
                    if (this.props.panel) {
                        return (<MapPanel />);
                    }
                    return null;
                })()}
                <div id="map-inspection-components" />
            </div>
        );
    }
}

Map.propTypes = {
    panel: React.PropTypes.bool,
};

Map.defaultProps = {
    panel: true,
};
