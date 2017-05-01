import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
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
    window.open('https://mapzen.com/products/tangram/', '_blank');
  }

  onClickGetStarted() {
    window.open('./docs/', '_blank');
  }

  render() {
    return (
      <Modal
        className="welcome-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-welcome-text">
          <h2>Welcome to Tangram Play!</h2>

          <p>
            We’re excited to release the public beta of Tangram Play, a text
            editor for working with Tangram, our web map rendering library.
            Your use of Play during this phase will help us improve our tools
            for web map design.
          </p>

          <div className="call-to-action">
            <button onClick={this.onClickGetStarted}>Get started guide</button>
            <button onClick={this.onClickTangram}>Learn more about Tangram</button>
          </div>

          <div className="modal-buttons">
            <Button onClick={this.onClickClose} className="button-confirm">
              <Icon type="bt-check" /> Continue
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

WelcomeModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
};

export default connect()(WelcomeModal);
