import { noop } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';

export default class ErrorModal extends React.Component {
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
        this.component.unmount();
        // After unmounting, `componentWillUnmount()` is called and the
        // `confirmFunction()` will be executed.
    }

    render() {
        return (
            <Modal
                className="error-modal"
                ref={(ref) => { this.component = ref; }}
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

// For cached reference to element
let modalContainerEl;

/**
 * A convenience function for displaying the ErrorModal. Right now this is
 * rendered into `modal-container` on each request. TODO: is there a better
 * way to do this?
 *
 * @param {string} message - the message to display in the modal
 * @param {Function} callback - callback function to execute when the error
 *          modal is unmounted. This is passed in to ErrorModal's props as
 *          `confirmFunction`
 */
export function showErrorModal(message, callback = noop) {
    if (!modalContainerEl || !modalContainerEl.nodeName) {
        modalContainerEl = document.getElementById('modal-container');
    }

    ReactDOM.render(<ErrorModal error={message} confirmFunction={callback} />, modalContainerEl);
}
