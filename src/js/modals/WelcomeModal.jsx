import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import { HIDE_MODAL, DISMISS_WELCOME_SCREEN } from '../store/actions';

class WelcomeModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onClickClose = this.onClickClose.bind(this);
  }

  onClickClose() {
    this.props.dispatch({
      type: HIDE_MODAL,
      id: this.props.modalId,
    });

    this.props.dispatch({ type: DISMISS_WELCOME_SCREEN });
  }

  render() {
    return (
      <Modal
        className="welcome-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-welcome-text">
          <h4>Welcome to Tangram Play!</h4>

          <p>
            Tangram Play is an editor for Tangram scenes. This is a public beta test. You will do awesome things with maps and also help us make a better Tangram editor for everyone too.
          </p>

          <ul>
            <li><a href="">Get started with Tangram Play</a></li>
            <li><a href="">Learn more about Tangram</a></li>
          </ul>
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickClose} className="button-confirm">Continue</Button>
        </div>
      </Modal>
    );
  }
}

WelcomeModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
};

export default connect()(WelcomeModal);
