import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';

class CodeSnippetModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onClickClose = this.onClickClose.bind(this);
  }

  onClickClose() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  render() {
    const url = (this.props.scene && this.props.scene.entrypoint_url) || '[YOUR SCENE FILE HERE]';
    const hash = window.location.hash.slice(1).split('/');
    const content = `var map = L.map('map');
var layer = Tangram.leafletLayer({
  scene: '${url}',
  attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors'
});
layer.addTo(map);
map.setView([${hash[1]}, ${hash[2]}], ${hash[0]});
`;

    return (
      <Modal
        className="code-snippet-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text">
          <h4>Code snippet for Tangram</h4>

          <p>
            You can copy-paste this JavaScript code to use this scene file with Tangram.
            To learn more about usage, and view more sample code, take a look at <a href="https://mapzen.com/documentation/tangram/" target="_blank" rel="noopener noreferrer">Tangram documentation</a>.
          </p>
        </div>

        <div className="modal-well code-snippet-textarea-container">
          <textarea defaultValue={content} />
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickClose} className="button-confirm">Done</Button>
        </div>
      </Modal>
    );
  }
}

CodeSnippetModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
  scene: React.PropTypes.shape({
    entrypoint_url: React.PropTypes.string,
  }),
};

CodeSnippetModal.defaultProps = {
  scene: {
    entrypoint_url: '[YOUR SCENE FILE HERE]',
  },
};

function mapStateToProps(state) {
  return {
    scene: state.scene.mapzenSceneData,
  };
}

export default connect(mapStateToProps)(CodeSnippetModal);
