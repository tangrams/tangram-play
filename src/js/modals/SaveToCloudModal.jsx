import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

import { showErrorModal } from './ErrorModal';
import { saveToMapzenUserAccount } from '../storage/mapzen';
import { editor } from '../editor/editor';
import { getRootFileName } from '../editor/io';
import { replaceHistoryState } from '../tools/url-state';

// Redux
import { SHOW_MODAL, MAPZEN_SAVE_SCENE } from '../store/actions';

// Default values in UI
const DEFAULT_SCENE_NAME = 'Untitled scene';
const SAVE_TIMEOUT = 20000; // ms before we assume saving is failure
const DEFAULT_VALUES = {
  sceneName: DEFAULT_SCENE_NAME,
  sceneDescription: '',
  sceneIsPublic: true,
};

class SaveToCloudModal extends React.Component {
  constructor(props) {
    super(props);

    this.timeout = null;

    this.state = {
      ...DEFAULT_VALUES,
      thinking: false,
    };

    this.onChangeSceneName = this.onChangeSceneName.bind(this);
    this.onChangeSceneDescription = this.onChangeSceneDescription.bind(this);
    this.onChangeScenePublic = this.onChangeScenePublic.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.setReadyUI = this.setReadyUI.bind(this);
    this.handleSaveSuccess = this.handleSaveSuccess.bind(this);
    this.handleSaveError = this.handleSaveError.bind(this);
    this.unmountSelf = this.unmountSelf.bind(this);
  }

  componentDidMount() {
    this.setReadyUI();
  }

  componentWillReceiveProps(nextState, nextProps) {
    if (nextProps.visible === true) {
      this.setReadyUI();
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.timeout);
  }

  onChangeSceneName(event) {
    this.setState({ sceneName: event.target.value });
  }

  onChangeSceneDescription(event) {
    this.setState({ sceneDescription: event.target.value });
  }

  onChangeScenePublic(event) {
    this.setState({ sceneIsPublic: event.target.checked });
  }

  onClickConfirm() {
    // Waiting state
    this.setState({
      thinking: true,
    });

    // Name of the scene
    let name = this.state.sceneName.trim();
    if (name.length === 0) {
      name = DEFAULT_SCENE_NAME;
    }

    // Description is optional
    // or appended to the user-produced value
    const description = this.state.sceneDescription.trim();

    const data = {
      name,
      description,
      public: this.state.sceneIsPublic,
      entrypoint: getRootFileName(),
    };

    saveToMapzenUserAccount(data)
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
    this.resetInputs();
    this.unmountSelf();
  }

  setReadyUI() {
    // Put the cursor on 'Scene name'
    this.nameInput.focus();
    this.nameInput.select();
  }

  /**
   * Called when modal is canceled or save is aborted.
   * This resets the inputs to its initial state.
   * Do not call this if save is successful. This is because
   * a user might want to have follow up saves where the same
   * settings might be used.
   */
  resetInputs() {
    this.setState(DEFAULT_VALUES);
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

    // Store scene data
    this.props.dispatch({
      type: MAPZEN_SAVE_SCENE,
      data,
    });

    // Update the page URL. The scene parameter should
    // reflect the new scene URL.
    replaceHistoryState({ scene: data.entrypoint_url });

    // Show success modal
    this.props.dispatch({
      type: SHOW_MODAL,
      modalType: 'SAVE_TO_CLOUD_SUCCESS',
      modalProps: {
        urlValue: data.entrypoint_url,
      },
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
    return (
      /* Modal disableEsc is true if we are waiting for a server response */
      <Modal
        className="modal-alt save-to-cloud-modal"
        disableEsc={this.state.thinking}
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <div className="modal-text">
          <h4>Save this scene to your Mapzen account</h4>
          <p>
            This uploads your Tangram scene file to your Mapzen
            account, so you’ll have a permanent link to share publicly.
          </p>
        </div>

        <hr />

        <div className="modal-content">
          <label htmlFor="save-scene-name">Scene name</label>
          <input
            type="text"
            id="save-scene-name"
            value={this.state.sceneName}
            ref={(ref) => { this.nameInput = ref; }}
            placeholder="(default: Tangram scene)"
            onChange={this.onChangeSceneName}
          />
          <p>
            <label htmlFor="save-scene-description">Scene description</label>
            <input
              type="text"
              id="save-scene-description"
              value={this.state.sceneDescription}
              placeholder="(optional description)"
              onChange={this.onChangeSceneDescription}
            />
          </p>
          <p>
            <label htmlFor="save-scene-public">Public scene</label>
            <input
              type="checkbox"
              id="save-scene-public"
              checked={this.state.sceneIsPublic}
              style={{ marginLeft: '0.5em' }}
              onChange={this.onChangeScenePublic}
            />
          </p>
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

SaveToCloudModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
};

export default connect()(SaveToCloudModal);
