import { noop } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';

export default class ConfirmDialogModal extends React.Component {
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
        this.component.unmount();
        this.props.cancelCallback();
    }

    onClickConfirm() {
        this.component.unmount();
        this.props.confirmCallback();
    }

    render() {
        return (
            <Modal
                className="error-modal"
                ref={(ref) => { this.component = ref; }}
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
    // Error message might be an Error object or a string
    message: React.PropTypes.string.isRequired,
    confirmCallback: React.PropTypes.func,
    cancelCallback: React.PropTypes.func,
    focusConfirm: React.PropTypes.bool,
};

ConfirmDialogModal.defaultProps = {
    confirmCallback: noop,
    cancelCallback: noop,
    focusConfirm: true,
};

// For cached reference to element
let modalContainerEl;

/**
 * A convenience function for displaying the ConfirmDialogModal. Right now this is
 * rendered into `modal-container` on each request. TODO: is there a better
 * way to do this?
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
    if (!modalContainerEl || !modalContainerEl.nodeName) {
        modalContainerEl = document.getElementById('modal-container');
    }

    ReactDOM.render(
        <ConfirmDialogModal
            message={message}
            confirmCallback={confirmCallback}
            cancelCallback={cancelCallback}
        />,
        modalContainerEl
    );
}
