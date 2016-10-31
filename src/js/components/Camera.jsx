import React from 'react';
import { connect } from 'react-redux';
import IconButton from './IconButton';
import { takeScreenshot } from '../map/screenshot';
import { startVideoCapture } from '../map/video';

// Redux
import store from '../store';
import { SET_APP_STATE } from '../store/actions';

class Camera extends React.Component {
  constructor(props) {
    super(props);

    this.preventTransition = true;
    this.state = {
      recording: false,
    };

    this.onClickRecord = this.onClickRecord.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // On first mount, `isVisible` is false, but we do not want to animate
    // the transition, which causes the controls to appear briefly on the screen.
    // Internally we keep track of "first mount" state so that no animation
    // classes will be applied until after the controls are requested for the
    // first time.
    if (this.props.isVisible !== nextProps.isVisible) {
      this.preventTransition = false;
    }
  }

  onClickRecord() {
    this.setState({
      recording: !this.state.recording,
    });
    startVideoCapture();
  }

  onClickClose() {
    store.dispatch({
      type: SET_APP_STATE,
      cameraToolsVisible: false,
    });
  }

  render() {
    let infoText;
    let classNames = 'camera-component';

    // Add animation classes depending on state
    if (this.preventTransition === false) {
      if (this.props.isVisible) {
        classNames += ' camera-animate-enter';
      } else {
        classNames += ' camera-animate-leave';
      }
    }

    // Add classes when recording
    if (this.state.recording) {
      classNames += ' camera-is-recording';
    }

    // Disable the video button on environments that cannot support it
    // http://caniuse.com/#search=MediaRecorder
    // Currently: only Chrome, Firefox, Opera
    const recordIsDisabled = typeof window.MediaRecorder !== 'function';
    let recordIcon = 'bt-circle';
    let recordTooltip = 'Capture video clip';

    if (this.state.recording) {
      recordIcon = 'bt-square';
      recordTooltip = 'Stop capturing video and save';
      infoText = 'Recording…';
    }

    // Note: tooltips are currently not showing on disabled buttons for
    // whatever reason.
    if (recordIsDisabled) {
      recordTooltip = 'Your browser does not support video capture';
    }

    // Experimental: show pixel size of the recording.
    // This makes a hard-coded request to the map element for its size.
    // Ideally, we should be able to request it from this component's size itself
    // (it is now set to be 100% of the map) but the problem is we cannot
    // determine it during render because the component's container element has
    // not mounted. We can solve this in other ways, but let's prove this is a
    // good idea first. TODO: respond to changes in browser window and map
    // element size. TODO: take into account monitor pixel density.
    if (!this.state.recording) {
      if (document.getElementById('map')) {
        const dims = document.getElementById('map').getBoundingClientRect();
        infoText = `${dims.width}px × ${dims.height}px`;
      }
    }

    return (
      <div className={classNames} ref={ref => { this.el = ref; }}>
        <div className="camera-controls modal">
          <IconButton
            className="camera-screenshot-button"
            onClick={takeScreenshot}
            icon="bt-camera"
            tooltip="Take a screenshot"
            disabled={this.state.recording === true}
          />
          <IconButton
            className="camera-record-button"
            onClick={this.onClickRecord}
            icon={recordIcon}
            tooltip={recordTooltip}
            disabled={recordIsDisabled}
          />
          <IconButton
            className="camera-close-button"
            onClick={this.onClickClose}
            icon="bt-times"
            tooltip="Close"
            disabled={this.state.recording === true}
          />
          <div className="camera-info">
            {infoText}
          </div>
        </div>
      </div>
    );
  }
}

Camera.propTypes = {
  isVisible: React.PropTypes.bool,
};

Camera.defaultProps = {
  isVisible: false,
};

function mapStateToProps(state) {
  return {
    isVisible: state.app.cameraToolsVisible,
  };
}

export default connect(mapStateToProps)(Camera);
