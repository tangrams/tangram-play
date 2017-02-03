import React from 'react';
import { connect } from 'react-redux';
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

  onClickTangram() {
    window.open('./docs/', '_blank');
  }

  onClickGetStarted() {
    window.open('https://mapzen.com/products/tangram/', '_blank');
  }

  render() {
    return (
      <Modal
        className="welcome-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-welcome-text">
          <h2>Welcome to the Tangram Play public beta test!</h2>

          <p>
            We are excited for the public beta release of Tangram Play, our GUI editor for designing maps in Tangram, our web map rendering software. Your use of Play in its beta stage will help shape it to be a useful tool for web map design.
          </p>
          <div className="call-to-action">
            <button onClick={this.onClickGetStarted}>Get started guide</button>
            <button onClick={this.onClickTangram}>Learn more about Tangram</button>
            <button onClick={this.onClickClose}>Continue to Tangram Play</button>
          </div>
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
