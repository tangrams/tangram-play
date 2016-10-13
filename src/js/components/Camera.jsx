/* eslint-disable indent, react/jsx-indent, react/jsx-indent-props */
import React from 'react';
import { connect } from 'react-redux';
import IconButton from './IconButton';
import { takeScreenshot } from '../map/screenshot';

// Redux
import store from '../store';
import { SET_APP_STATE } from '../store/actions';

class Camera extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recording: false,
    };

    this.onClickRecord = this.onClickRecord.bind(this);
  }

  onClickRecord() {
    this.setState({
      recording: !this.state.recording,
    });
  }

  onClickClose() {
    store.dispatch({
      type: SET_APP_STATE,
      cameraToolsVisible: false,
    });
  }

  render() {
    if (this.props.isVisible) {
      let recordIcon = 'bt-circle';
      if (this.state.recording) {
        recordIcon = 'bt-pause';
      }

      return (
        <div className="camera-component">
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
              tooltip="Record animation"
            />

            <div className="camera-label">Camera</div>

            <IconButton
              className="camera-close-button"
              onClick={this.onClickClose}
              icon="bt-times"
              tooltip="Close"
              disabled={this.state.recording === true}
            />
          </div>
        </div>
      );
    }

    return null;
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
