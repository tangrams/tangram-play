import { noop } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';

import store from '../store';
import { SHOW_MODAL } from '../store/actions';

class ErrorModal extends React.Component {
  constructor(props) {
    super(props);

    this.onClickClose = this.onClickClose.bind(this);
  }

  componentDidMount() {
    // Focus on the continue button when it is shown.
    // This is not currently the default action for modals, but may be in
    // the future.
    ReactDOM.findDOMNode(this.continueButton).focus(); // eslint-disable-line react/no-find-dom-node
  }

  // Always execute the confirm function after unmounting (clicking the
  // "Confirm" button unmounts)
  componentWillUnmount() {
    this.props.confirmFunction();
  }

  onClickClose() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
    // After unmounting, `componentWillUnmount()` is called and the
    // `confirmFunction()` will be executed.
  }

  render() {
    return (
      <Modal
        className="error-modal"
        cancelFunction={this.onClickClose}
      >
        <p className="modal-text">
          {this.props.error.message || this.props.error}
        </p>

        <div className="modal-buttons">
          <Button
            className="button-confirm"
            onClick={this.onClickClose}
            ref={(ref) => { this.continueButton = ref; }}
          >
            <Icon type="bt-check" />
            Continue
          </Button>
        </div>
      </Modal>
    );
  }
}

ErrorModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,

  // Error message might be an Error object or a string
  error: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.instanceOf(Error),
  ]).isRequired,
  confirmFunction: React.PropTypes.func,
};

ErrorModal.defaultProps = {
  confirmFunction: noop,
};

export default connect()(ErrorModal);

/**
 * A convenience function for displaying the ErrorModal.
 *
 * @param {string} message - the message to display in the modal
 * @param {Function} callback - callback function to execute when the error
 *          modal is unmounted. This is passed in to ErrorModal's props as
 *          `confirmFunction`
 */
export function showErrorModal(message, callback = noop) {
  store.dispatch({
    type: SHOW_MODAL,
    modalType: 'ERROR',
    modalProps: {
      error: message,
      confirmFunction: callback,
    },
  });
}
