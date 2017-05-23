import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import SceneItem from './SceneItem';
import Icon from '../components/Icon';

import { load } from '../tangram-play';
import EXAMPLES_DATA from './examples.json';

class ExamplesModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scenes: EXAMPLES_DATA[0].scenes,
      selected: null,
    };

    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
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
        url: this.state.selected.url,
        data: this.state.selected,
        source: 'EXAMPLES',
      });
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
        <h4>Choose an example to open</h4>

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

ExamplesModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
};

export default connect()(ExamplesModal);
