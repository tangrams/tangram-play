import L from 'leaflet';
import React from 'react';
import { connect } from 'react-redux';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import IconButton from './IconButton';
import MapPanelZoom from './MapPanelZoom';
import MapPanelLocationBar from './MapPanelLocationBar';
import MapPanelBookmarks from './MapPanelBookmarks';

import { map } from '../map/map';
import { showErrorModal } from '../modals/ErrorModal';

// Redux
import { SET_SETTINGS } from '../store/actions';

/**
 * Represents the main map panel that user can toggle in and out of the leaflet
 * map.
 */
class MapPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      geolocatorButton: 'bt-map-arrow', // Icon to display for the geolocator button
      geolocateActive: {
        active: false,
      }, // Whether the geolocate function has been activated
    };

    this.toggleMapPanel = this.toggleMapPanel.bind(this);
    this.clickGeolocator = this.clickGeolocator.bind(this);
    this.onGeolocateSuccess = this.onGeolocateSuccess.bind(this);
  }

  /** Geolocator functionality **/

  /**
   * If the geolocator finds a user position succesfully, re-render the map
   * and panel to reflect new position
   * @param position - the new position to which map has moved
   */
  onGeolocateSuccess(position) {
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
        active: true,
        latlng: { lat: latitude, lng: longitude },
      },
    });
    this.setState({
      geolocateActive: {
        active: false,
      },
    });

    const originalZoom = map.getZoom();
    let desiredZoom = originalZoom;

    // Only zoom to a radius if the accuracy is actually a number or present
    if (accuracy) {
      // The circle needs to be added to the map in order for .getBounds() to work
      const circle = L.circle([latitude, longitude], accuracy).addTo(map);
      const bounds = circle.getBounds();

      // Fit view to the accuracy diameter
      map.fitBounds(bounds);

      // If the new zoom level is within a +/- 1 range of the original
      // zoom level, keep it the same
      const newZoom = map.getZoom();
      desiredZoom = (newZoom >= originalZoom - 1 && newZoom <= originalZoom + 1) ?
        originalZoom : newZoom;

      // Clean up
      circle.remove();
    } else {
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
  onGeolocateError(err) {
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
      // eslint-disable-next-line max-len
      message = 'Your current position is unavailable in this browser because Tangram Play wasn’t loaded over a secure URL.';
    } else {
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          // eslint-disable-next-line max-len
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

    showErrorModal(message);
  }

  /**
   * Fired when user clicks on geolocator button
   */
  clickGeolocator() {
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
    this.setState({ geolocatorButton: 'bt-sync bt-spin active' });
  }

  /**
   * Toggle the panel so it is visible or not visible
   */
  toggleMapPanel() {
    const value = !this.props.open;

    // Save the position in Redux
    this.props.dispatch({
      type: SET_SETTINGS,
      mapToolbarDisplay: value,
    });
  }

  render() {
    if (this.props.disabled) return null;

    return (
      <div className="map-panel">
        {/* Map panel*/}
        <Panel collapsible expanded={this.props.open} className="map-panel-collapsible">
          <div className="map-panel-toolbar">
            <MapPanelZoom />

            {/* Search buttons*/}
            <div className="map-panel-search-bookmarks">
              <MapPanelLocationBar geolocateActive={this.state.geolocateActive} />
              <MapPanelBookmarks />
            </div>

            {/* Locate me button*/}
            <ButtonGroup className="buttons-locate">
              <IconButton
                icon={this.state.geolocatorButton}
                tooltip="Locate me"
                onClick={this.clickGeolocator}
              />
            </ButtonGroup>

            {/* Toggle map panel to show it*/}
            <ButtonGroup className="buttons-toggle">
              <IconButton
                icon="bt-caret-up"
                tooltip="Toggle map toolbar"
                onClick={this.toggleMapPanel}
              />
            </ButtonGroup>
          </div>
        </Panel>

        {/* Toggle map panel to show it*/}
        {(() => {
          if (!this.props.open) {
            return (
              <IconButton
                icon="bt-caret-down"
                tooltip="Toggle map toolbar"
                className="map-panel-button-show"
                onClick={this.toggleMapPanel}
              />
            );
          }
          return null;
        })()}
      </div>
    );
  }
}

MapPanel.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  disabled: React.PropTypes.bool,
  // Whether panel should be open or not
  open: React.PropTypes.bool,
};

MapPanel.defaultProps = {
  disabled: false,
  open: true,
};

function mapStateToProps(state) {
  return {
    disabled: state.app.disableMapToolbar,
    open: state.settings.mapToolbarDisplay,
  };
}

export default connect(mapStateToProps)(MapPanel);
