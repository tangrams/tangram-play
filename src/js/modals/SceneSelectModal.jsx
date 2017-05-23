import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import SceneItem from './SceneItem';
import Icon from '../components/Icon';

class SceneSelectModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      selected: null,
      scenes: props.scenes, // May replace with result from sceneLoader()
    };

    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
  }

  onClickCancel() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });

    this.props.cancelHandler();
  }

  onClickConfirm() {
    if (this.state.selected) {
      this.onClickCancel(); // Close modal
      this.props.confirmHandler(this.state.selected);
    }
  }

  render() {
    const scenes = this.state.scenes;

    const sceneList = scenes.map((item, index) => {
      let classString = '';

      if (this.state.selected && this.state.selected.url === item.url) {
        classString = 'open-scene-selected';
      }

      return (
        <div
          className={classString}
          role="menuitem"
          tabIndex={0}
          key={item.url}
          onFocus={(e) => { this.setState({ selected: item }); }}
          onClick={() => { this.setState({ selected: item }); }}
          onDoubleClick={this.onClickConfirm}
        >
          <SceneItem
            thumbnail={item.thumb}
            name={item.name}
            description={item.description}
          />
        </div>
      );
    });

    // Render the entire modal
    return (
      <Modal
        className="modal-alt open-scene-modal"
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <h4>{this.props.title}</h4>

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

SceneSelectModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  scenes: PropTypes.arrayOf(PropTypes.object),
  sceneLoader: PropTypes.func,
  confirmHandler: PropTypes.func.isRequired,
  cancelHandler: PropTypes.func,
};

SceneSelectModal.defaultProps = {
  scenes: [],
  sceneLoader() {}, // No-op
  cancelHandler() {}, // No-op
};

export default connect()(SceneSelectModal);
