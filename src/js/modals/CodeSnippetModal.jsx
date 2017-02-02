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
    return (
      <Modal
        className="code-snippet-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-code-snippet-text">
          <h4>Code snippet for Tangram</h4>
        </div>

        <div className="modal-well code-snippet-modal-changelog">
          [TODO]
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
};

export default connect()(CodeSnippetModal);
