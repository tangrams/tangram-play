import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Clipboard from 'clipboard';

import IconButton from '../components/IconButton';
import Modal from './Modal';

class SaveGistSuccessModal extends React.Component {
  constructor(props) {
    super(props);

    this.onClickConfirm = this.onClickConfirm.bind(this);
  }

  componentDidMount() {
    this.setupClipboard();
    this.urlInput.select();
  }

  componentWillUnmount() {
    // Clean up clipboard object
    this.clipboard.destroy();
  }

  onClickConfirm(event) {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  // Sets up clipboard.js functionality. Not a React component.
  setupClipboard() {
    // eslint-disable-next-line react/no-find-dom-node
    const clipboardButtonEl = ReactDOM.findDOMNode(this.clipboardButton);

    // Initiate clipboard button
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

    clipboardButtonEl.focus();
  }

  render() {
    return (
      <Modal
        className="save-to-cloud-success-modal"
        cancelFunction={this.onClickConfirm}
      >
        <div className="modal-content">
          <h4>
              Your gist has been saved.
          </h4>
          <p>
              Remember this URL!
          </p>
          <div className="input-bar">
            <input
              type="text"
              id="gist-saved-url"
              readOnly="true"
              ref={(ref) => { this.urlInput = ref; }}
              defaultValue={this.props.urlValue}
            />
            <IconButton
              icon="bt-copy"
              tooltip="Copy to clipboard"
              className="saved-scene-copy-btn"
              data-clipboard-target="#gist-saved-url"
              buttonRef={(ref) => { this.clipboardButton = ref; }}
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

SaveGistSuccessModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  urlValue: PropTypes.string.isRequired,
  modalId: PropTypes.number.isRequired,
};

export default connect()(SaveGistSuccessModal);
