import { noop } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';

import store from '../store';
import { SHOW_MODAL } from '../store/actions';

class ConfirmDialogModal extends React.Component {
  constructor(props) {
    super(props);

    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
  }

  componentDidMount() {
    // Focus on the confirm button if `prop.focusConfirm` is true, which it
    // is by default. Set `focusConfirm={false}` for potentially dangerous
    // actions when you want to make sure the user has confirmed the action.
    if (this.props.focusConfirm === true) {
      // eslint-disable-next-line react/no-find-dom-node
      ReactDOM.findDOMNode(this.confirmButton).focus();
    } else {
      // eslint-disable-next-line react/no-find-dom-node
      ReactDOM.findDOMNode(this.cancelButton).focus();
    }
  }

  onClickCancel() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
    this.props.cancelCallback();
  }

  onClickConfirm() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
    this.props.confirmCallback();
  }

  render() {
    return (
      <Modal
        className="error-modal"
        cancelFunction={this.onClickCancel}
      >
        <p className="modal-text">
          {this.props.message}
        </p>

        <div className="modal-buttons">
          <Button
            className="button-cancel"
            onClick={this.onClickCancel}
            ref={(ref) => { this.cancelButton = ref; }}
          >
            <Icon type="bt-times" />
            Cancel
          </Button>
          <Button
            className="button-confirm"
            onClick={this.onClickConfirm}
            ref={(ref) => { this.confirmButton = ref; }}
          >
            <Icon type="bt-check" />
            Continue
          </Button>
        </div>
      </Modal>
    );
  }
}

ConfirmDialogModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,

  // Error message might be an Error object or a string
  message: PropTypes.string.isRequired,
  confirmCallback: PropTypes.func,
  cancelCallback: PropTypes.func,
  focusConfirm: PropTypes.bool,
};

ConfirmDialogModal.defaultProps = {
  confirmCallback: noop,
  cancelCallback: noop,
  focusConfirm: true,
};

export default connect()(ConfirmDialogModal);

/**
 * A convenience function for displaying the ConfirmDialogModal.
 *
 * @param {string} message - the message to display in the modal
 * @param {Function} confirmCallback - callback function to execute when the
 *          user selects the "Confirm" button. This is passed in as
 *          ConfirmDialogModal's `confirmCallback` prop.
 * @param {Function} cancelCallback - callback function to execute when the
 *          modal is canceled. This is passed in as ConfirmDialogModal's
 *          `cancelCallback` prop.
 */
export function showConfirmDialogModal(message, confirmCallback, cancelCallback) {
  store.dispatch({
    type: SHOW_MODAL,
    modalType: 'CONFIRM_DIALOG',
    modalProps: {
      message,
      confirmCallback,
      cancelCallback,
    },
  });
}
