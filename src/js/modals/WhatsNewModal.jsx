import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';

import Modal from './Modal';

class WhatsNewModal extends React.PureComponent {
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
        className="whatsnew-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-whatsnew-text">
          <h4>Welcome back!</h4>
        </div>

        <div className="modal-well whatsnew-modal-changelog">
          <iframe className="changelog-frame" src="./data/changelog.html" />
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickClose} className="button-confirm">Continue</Button>
        </div>
      </Modal>
    );
  }
}

WhatsNewModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
};

export default connect()(WhatsNewModal);
