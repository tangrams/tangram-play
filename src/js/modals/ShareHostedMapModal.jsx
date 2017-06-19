import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Clipboard from 'clipboard';

import IconButton from '../components/IconButton';
import Modal from './Modal';

function SplitUrlValue(urlValue) {
    var str = urlValue.split('/scenes/');
    var str2 = str[1].split('/resources');
    var apiSceneId = str2[0];
    return apiSceneId;
}

class ShareHostedMapModal extends React.Component {
  constructor(props) {
    super(props);

    this.initClipboard = this.initClipboard.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickViewUrl = this.onClickViewUrl.bind(this);
  }

  componentDidMount() {
    this.initClipboard();
    this.viewUrl.select();
  }

  componentWillUnmount() {
    this.clipboard.destroy();
  }

  onClickConfirm(event) {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  onClickViewUrl() {
    const newTab = window.open(this.viewUrl.value, 'tangram-viewer');
    if (newTab) {
      newTab.focus();
    }
  }

  // Sets up clipboard.js functionality. Not a React component.
  initClipboard() {
    /* eslint-disable no-console */
    // eslint-disable-next-line react/no-find-dom-node
    const clipboardButtonEl = ReactDOM.findDOMNode(this.clipboardButton);

    this.clipboard = new Clipboard(clipboardButtonEl);
    this.clipboard.on('success', (e) => {
      console.info('Action:', e.action);
      console.info('Text:', e.text);
      console.info('Trigger:', e.trigger);

      e.clearSelection();
    });
    this.clipboard.on('error', (e) => {
      console.error('Action:', e.action);
      console.error('Trigger:', e.trigger);
    });
    /* eslint-enable no-console */
  }
  render() {
    return (
      <Modal
        className="save-to-cloud-success-modal"
        cancelFunction={this.onClickConfirm}
      >
        <h4>Share your scene!</h4>
        <div className="modal-content">
          <p>
            Copy the link below for later, or view it in your browser.
          </p>

          <div className="input-bar">
            <input
              id="saved-scene-url"
              type="text"
              readOnly="true"
              ref={(ref) => { this.viewUrl = ref; }}
              defaultValue={`${window.location.origin}/tangram/view/?scene=${splitUrlValue(this.props.urlValue)}${window.location.hash}`}
            />
            <IconButton
              icon="bt-copy"
              tooltip="Copy to clipboard"
              className="saved-scene-copy-btn"
              data-clipboard-target="#saved-scene-url"
              buttonRef={(ref) => { this.clipboardButton = ref; }}
            />
            <IconButton
              icon="bt-external-link"
              tooltip="View in new tab"
              className="saved-scene-copy-btn"
              onClick={this.onClickViewUrl}
            />
          </div>
        </div>

        <div className="modal-buttons">
          <Button className="button-confirm" onClick={this.onClickConfirm}>
            Got it
          </Button>
        </div>
      </Modal>
    );
  }
}

ShareHostedMapModal.propTypes = {
  urlValue: PropTypes.string.isRequired,
};

ShareHostedMapModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  return {
    urlValue: state.scene.sourceData.entrypoint_url,
  };
}

export default connect(mapStateToProps)(ShareHostedMapModal);
