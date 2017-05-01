/**
 * Confirmation dialog box for saving over a existing scene to the Mapzen Scene API.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
import SceneItem from './SceneItem';
import LoadingSpinner from './LoadingSpinner';

import { showErrorModal } from './ErrorModal';
import { getEditorContent } from '../editor/editor';
import { markSceneSaved } from '../editor/io';
import { putFile, replaceThumbnail } from '../storage/mapzen';
import { MAPZEN_SAVE_SCENE } from '../store/actions';

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
    const overwriteFile = putFile(content, this.props.scene.entrypoint_url);
    const overwriteThumbnail = replaceThumbnail(this.props.scene.id);

    // Create a new thumbnail
    Promise.all([overwriteThumbnail, overwriteFile])
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

    markSceneSaved({
      type: MAPZEN_SAVE_SCENE,
      data: data[0],
    });
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
        className="modal-alt save-existing-to-cloud-modal"
        disableEsc={this.state.thinking}
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <div className="modal-text">
          <h4>Overwrite your scene?</h4>
        </div>

        <div className="modal-content">
          <SceneItem
            thumbnail={scene.thumbnail}
            name={scene.name}
            description={scene.description}
            date={scene.updated_at}
          />
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
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
  scene: PropTypes.shape({
    id: PropTypes.number,
    entrypoint_url: PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    scene: state.scene.mapzenSceneData,
  };
}

export default connect(mapStateToProps)(SaveExistingToCloudModal);
