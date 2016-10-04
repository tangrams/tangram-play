import React from 'react';
import { connect } from 'react-redux';
import MapPanel from './MapPanel';
import MapLoading from '../map/MapLoading';
import { initMap, destroyScene } from '../map/map';

class Map extends React.Component {
    componentDidMount() {
        // We have to run initMap here because this instantiates Leaflet
        // into a map container, which expects the DOM element for it to
        // exist already. So we can only call it during this lifecycle method.
        initMap();
    }

    componentWillUpdate(nextProps) {
        if (this.props.app.initialized && (nextProps.files.length === 0 || this.props.app.mapNotLoaded === true)) {
            destroyScene();
        }
    }

    render() {
        return (
            <div className="map-container" id="map-container">
                {(() => {
                    // Don't flash this when Tangram Play is initializing;
                    // files are still zero, but we won't prompt until after
                    if (!this.props.app.initialized) return null;

                    if (this.props.files.length === 0 || this.props.app.mapNotLoaded === true) {
                        return (
                            <div className="map-view-not-loaded" />
                        );
                    }
                    return null;
                })()}
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
    app: React.PropTypes.object,
    files: React.PropTypes.array,
};

Map.defaultProps = {
    panel: true,
};

function mapStateToProps(state) {
    return {
        app: state.app,
        files: state.files.files,
    };
}

export default connect(mapStateToProps)(Map);
