import React from 'react';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';
import MapPanel from './MapPanel';
import Camera from './Camera';
import MapLoading from '../map/MapLoading';
import { initMap, loadScene, destroyScene, refreshMap } from '../map/map';

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.updateMapWidth = this.updateMapWidth.bind(this);
  }

  componentDidMount() {
    EventEmitter.subscribe('divider:reposition', this.updateMapWidth);

    // We have to run initMap here because this instantiates Leaflet
    // into a map container, which expects the DOM element for it to
    // exist already. So we can only call it during this lifecycle method.
    initMap();
  }

  componentWillUpdate(nextProps) {
    // If we don't have any scene files, kill the map so it doesn't take memory
    if (this.props.app.initialized &&
      (nextProps.scene.files.length === 0 || this.props.app.mapNotLoaded === true)) {
      destroyScene();

      // Bail from `componentWillUpdate`, we're done here
      return;
    }

    // If the scene has changed, load the scene file from the root scene
    // contents, which should already be fetched by now. Don't load the
    // originalUrl, because contents may differ from the originalUrl due
    // to user edits.
    if (nextProps.scene.counter > this.props.scene.counter) {
      const { scene } = nextProps;
      const rootFile = scene.rootFileIndex;
      const url = URL.createObjectURL(new Blob([scene.files[rootFile].contents]));

      loadScene(url, {
        reset: true,
        basePath: scene.originalBasePath,
      });
    }
  }

  // Updating map element width can happen many times a second while it's
  // being resized. Directly adjusting DOM in this way is much faster than
  // re-rendering on a state change.
  updateMapWidth(event) {
    this.mapEl.style.width =`${event.posX}px`;

    // Invalidates and refreshes Leaflet's map size.
    refreshMap();
  }

  render() {
    return (
      <div className="map-container" id="map-container" ref={(ref) => { this.mapEl = ref; }}>
        {(() => {
          // Don't flash this when Tangram Play is initializing;
          // files are still zero, but we won't prompt until after
          if (!this.props.app.initialized) return null;

          if (this.props.scene.files.length === 0 || this.props.app.mapNotLoaded === true) {
            return (
              <div className="map-view-not-loaded" />
            );
          }
          return null;
        })()}
        <div className="map-view" id="map" />
        <Camera />
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
  scene: React.PropTypes.object
};

Map.defaultProps = {
  panel: true,
};

function mapStateToProps(state) {
  return {
    app: state.app,
    scene: state.scene,
  };
}

export default connect(mapStateToProps)(Map);
