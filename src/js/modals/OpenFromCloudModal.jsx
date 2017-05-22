import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';

import Modal from './Modal';
import Icon from '../components/Icon';
import { showErrorModal } from './ErrorModal';
import { load } from '../tangram-play';
import { fetchSceneList, deleteScene } from '../storage/mapzen';

class OpenFromCloudModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      scenes: [],
      selected: null,
      beingDeleted: null,
    };

    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickSceneItem = this.onClickSceneItem.bind(this);
    this.onDoubleClickSceneItem = this.onDoubleClickSceneItem.bind(this);
    this.onClickDeleteScene = this.onClickDeleteScene.bind(this);
    this.getSceneList = this.getSceneList.bind(this);
  }

  componentWillMount() {
    this.getSceneList();
  }

  onClickCancel() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  onClickConfirm() {
    if (this.state.selected) {
      this.onClickCancel(); // to close modal
      load({
        url: this.state.selected.entrypoint_url,
        data: this.state.selected,
      });
    }
  }

  onClickSceneItem(event, item) {
    if (this.state.beingDeleted !== item.id) {
      this.setState({ selected: item });
    }
  }

  onDoubleClickSceneItem(event, item) {
    if (this.state.beingDeleted !== item.id) {
      this.onClickConfirm();
    }
  }

  onClickDeleteScene(event, sceneId) {
    event.stopPropagation();
    this.setState({
      beingDeleted: sceneId,
      selected: null, // Prevent the deleted scene from being selected
    });
    deleteScene(sceneId)
      .then(() => {
        this.setState({ beingDeleted: null });
        this.getSceneList();
      })
      .catch((error) => {
        showErrorModal('Could not delete the scene.');
      });
  }

  getSceneList() {
    // Always load new set of saved scenes from the cloud each
    // time this modal is opened, in case it has changed
    fetchSceneList()
      .then((scenes = []) => {
        this.setState({
          loaded: true,
          scenes,
        });
      });
  }

  /**
   * If opening a URL is not successful
   * TODO: figure out what happens here.
   */
  handleError(error, value) {
    // Close the modal
    this.onClickCancel();

    showErrorModal(`Could not load the scene! ${error.message}`);
  }

  render() {
    const scenes = this.state.scenes;
    const noScenesMsg = 'No scenes have been saved!';

    let sceneList = scenes.map((item, index) => {
      // If the scene is selected, a special class is applied later to it
      let classString = 'open-scene-option';
      let deleteButtonText = 'Delete';

      if (this.state.selected && this.state.selected.id === item.id) {
        classString += ' open-scene-selected';
      }

      if (this.state.beingDeleted && this.state.beingDeleted === item.id) {
        classString += ' open-scene-deleting';
        deleteButtonText = 'Deleting...';
      }

      // TODO:
      // There is actually a lot more info stored than is currently being
      // displayed. We have date, user, public or not, and map view.
      return (
        <div
          className={classString}
          role="menuitem"
          tabIndex={0}
          key={item.id}
          onFocus={(e) => { this.onClickSceneItem(e, item); }}
          onClick={(e) => { this.onClickSceneItem(e, item); }}
          onDoubleClick={(e) => { this.onDoubleClickSceneItem(e, item); }}
        >
          <div className="open-scene-option-thumbnail">
            <img src={item.thumbnail} alt="" />
          </div>
          <div className="open-scene-option-info">
            <div className="open-scene-option-name">
              {item.name}
            </div>
            <div className="open-scene-option-description">
              {item.description || 'No description provided.'}
            </div>
            <div className="open-scene-option-date">
              {/* Show the date this was saved.
                  TODO: better formatting;
                  maybe use moment.js */}
              Saved on {new Date(item.updated_at).toLocaleString()}
            </div>
          </div>
          <div className="open-scene-option-tasks">
            <button
              onClick={(e) => { this.onClickDeleteScene(e, item.id); }}
              disabled={this.state.beingDeleted !== null}
            >
              {deleteButtonText}
            </button>
          </div>
        </div>
      );
    });

    // If, after parsing scenes, nothing is there, display message.
    if (this.state.loaded === true && sceneList.length === 0) {
      sceneList = noScenesMsg;
    }

    // Render the entire modal
    return (
      <Modal
        className="modal-alt open-scene-modal"
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <h4>Open a saved scene from your Mapzen account</h4>

        <div className="modal-content modal-well open-scene-list">
          {sceneList}
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickCancel} className="button-cancel">
            <Icon type="bt-times" /> Cancel
          </Button>
          <Button
            onClick={this.onClickConfirm}
            className="button-confirm"
            disabled={this.state.selected === null}
          >
            <Icon type="bt-check" /> Open
          </Button>
        </div>
      </Modal>
    );
  }
}

OpenFromCloudModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
};

export default connect()(OpenFromCloudModal);
