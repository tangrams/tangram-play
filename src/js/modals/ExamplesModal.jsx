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
    // Create a <section> per category
    const examples = EXAMPLES_DATA.map((category) => {
      // Create elements for each scene
      const scenes = category.scenes.map((scene) => {
        // If the scene is selected, a special class is applied
        // to indicate that
        let classString = '';
        if (this.state.selected && this.state.selected.url === scene.url) {
          classString = 'open-scene-selected';
        }

        return (
          <div
            className={classString}
            role="menuitem"
            tabIndex={0}
            key={scene.url}
            onFocus={(e) => { this.setState({ selected: scene }); }}
            onClick={() => { this.setState({ selected: scene }); }}
            onDoubleClick={this.onClickConfirm}
          >
            <SceneItem
              thumbnail={scene.thumb}
              name={scene.name}
              description={scene.description}
            />
          </div>
        );
      });

      // Render the category container element
      // return (
      //   <section key={category.category}>
      //     <h2 className="example-list-header">{category.category}</h2>
      //     <hr />
      //     {scenes}
      //   </section>
      // );
      return <div key={category.category}>{scenes}</div>;
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
          {examples}
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
