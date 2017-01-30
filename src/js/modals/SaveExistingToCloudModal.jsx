/**
 * Confirmation dialog box for saving over a existing scene to the Mapzen Scene API.
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

import { showErrorModal } from './ErrorModal';
import { editor, getEditorContent } from '../editor/editor';
import { putFile } from '../storage/mapzen';

const SAVE_TIMEOUT = 20000; // ms before we assume saving is failure

class SaveExistingToCloudModal extends React.Component {
  constructor(props) {
    super(props);

    this.timeout = null;

    this.state = {
      thinking: false,
    };

    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.handleSaveSuccess = this.handleSaveSuccess.bind(this);
    this.handleSaveError = this.handleSaveError.bind(this);
    this.unmountSelf = this.unmountSelf.bind(this);
  }

  componentWillUnmount() {
    window.clearTimeout(this.timeout);
  }

  onClickConfirm() {
    // Waiting state
    this.setState({
      thinking: true,
    });

    // This is a single YAML file for now - whatever's in the current editor.
    // TODO: get only root scene file
    const content = getEditorContent();

    // And it saves to the root entry point
    putFile(content, this.props.scene.entrypoint_url)
      .then(this.handleSaveSuccess)
      .catch(this.handleSaveError);

    // Start save timeout
    // TODO: This does not cancel the request if it is in progress
    // TODO: Test this
    this.timeout = window.setTimeout(() => {
      // eslint-disable-next-line max-len
      const errorMsg = 'The server haven’t responded in a while, so we’re going stop trying. Please try again later!';
      this.handleSaveError({ message: errorMsg });
    }, SAVE_TIMEOUT);
  }

  onClickCancel(event) {
    window.clearTimeout(this.timeout);
    this.unmountSelf();
  }

  /**
   * If successful, turn off wait state, mark as clean state in the editor,
   * remember the success response, and display a helpful message
   */
  handleSaveSuccess(data) {
    // Close the modal
    this.unmountSelf();

    // Mark as clean state in the editor
    editor.doc.markClean();
  }

  /**
   * If opening a URL is not successful, turn off wait state,
   * and display the error message.
   *
   * @param {Error} Thrown by something else
   */
  handleSaveError(error) {
    // Close the modal, if present
    this.unmountSelf();
    console.trace(error);

    const errorMessage = `Uh oh! We tried to save your scene but something went wrong. ${error.message}`;

    showErrorModal(errorMessage);
  }

  unmountSelf() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  render() {
    const scene = this.props.scene;

    return (
      /* Modal disableEsc is true if we are waiting for a server response */
      <Modal
        className="modal-alt save-to-cloud-modal"
        disableEsc={this.state.thinking}
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <div className="modal-text">
          <h4>Overwrite your scene?</h4>
        </div>

        <div className="modal-content">
          <div className="open-from-cloud-option">
            <div className="open-from-cloud-option-thumbnail">
              <img src={scene.thumbnail} alt="" />
            </div>
            <div className="open-from-cloud-option-info">
              <div className="open-from-cloud-option-name">
                {scene.name}
              </div>
              <div className="open-from-cloud-option-description">
                {scene.description || 'No description provided.'}
              </div>
              <div className="open-from-cloud-option-date">
                {/* Show the date this was saved.
                    TODO: better formatting;
                    maybe use moment.js */}
                Saved on {new Date(scene.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-buttons">
          <LoadingSpinner on={this.state.thinking} />
          <Button
            className="button-cancel"
            disabled={this.state.thinking}
            onClick={this.onClickCancel}
          >
            <Icon type="bt-times" /> Cancel
          </Button>
          <Button
            className="button-confirm"
            disabled={this.state.thinking}
            onClick={this.onClickConfirm}
          >
            <Icon type="bt-check" /> Save
          </Button>
        </div>
      </Modal>
    );
  }
}

SaveExistingToCloudModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
  scene: React.PropTypes.shape({
    id: React.PropTypes.number,
    entrypoint_url: React.PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    scene: state.scene.mapzenSceneData,
  };
}

export default connect(mapStateToProps)(SaveExistingToCloudModal);
