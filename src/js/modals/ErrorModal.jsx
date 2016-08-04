import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';
import noop from 'lodash/noop';

export default class ErrorModal extends React.Component {
    componentDidMount () {
        // Focus on the continue button when it is shown.
        // This is not currently the default action for modals, but may be in
        // the future.
        ReactDOM.findDOMNode(this.continueButton).focus();
    }

    // Always execute the confirm function after unmounting (clicking the
    // "Confirm" button unmounts)
    componentWillUnmount () {
        this.props.confirmFunction();
    }

    onClickClose () {
        ReactDOM.unmountComponentAtNode(document.getElementById('modal-container'));
    }

    render () {
        return (
            <Modal className='error-modal' cancelFunction={this.onClickClose}>
                <p className='modal-text'>
                    {this.props.error.message || this.props.error}
                </p>

                <div className='modal-buttons'>
                    <Button
                        className='modal-confirm'
                        onClick={this.onClickClose}
                        ref={(ref) => { this.continueButton = ref; }}
                    >
                        <Icon type={'bt-check'} />
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
        React.PropTypes.instanceOf(Error)
    ]).isRequired,
    confirmFunction: React.PropTypes.func
};

ErrorModal.defaultProps = {
    confirmFunction: noop
};
