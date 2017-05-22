import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
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
      load({ url: this.state.selected });
    }
  }

  render() {
    // Create a <section> per category
    const examples = EXAMPLES_DATA.map((category) => {
      // Create elements for each scene
      const scenes = category.scenes.map((scene) => {
        // Inline style to display thumbnail image
        const thumbnailStyle = {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backgroundImage: `url(${scene.thumb})`,
        };

        // If the scene is selected, a special class is applied
        // to indicate that
        let classString = 'open-scene-option';

        if (this.state.selected === scene.url) {
          classString += ' open-scene-selected';
        }

        // Render a thumbnail container element
        return (
          <div
            className={classString}
            role="menuitem"
            tabIndex={0}
            key={scene.url}
            onFocus={(e) => { this.setState({ selected: scene.url }); }}
            onClick={() => { this.setState({ selected: scene.url }); }}
            onDoubleClick={this.onClickConfirm}
          >
            <div className="open-scene-option-thumbnail">
              <img className="example-thumbnail" style={thumbnailStyle} alt="" />
            </div>
            <div className="open-scene-option-info">
              <div className="open-scene-option-name">
                {scene.name}
              </div>
              <div className="open-scene-option-description">
                {scene.description || 'No description provided.'}
              </div>
            </div>
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

        <div className="modal-content modal-well example-list">
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
