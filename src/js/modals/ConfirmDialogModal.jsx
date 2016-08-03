import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/icon.react';
import noop from 'lodash/noop';

export default class ConfirmDialogModal extends React.Component {
    constructor (props) {
        super(props);

        this.onClickCancel = this.onClickCancel.bind(this);
        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentDidMount () {
        // Focus on the confirm button if `prop.focusConfirm` is true, which it
        // is by default. Set `focusConfirm={false}` for potentially dangerous
        // actions when you want to make sure the user has confirmed the action.
        if (this.props.focusConfirm === true) {
            ReactDOM.findDOMNode(this.confirmButton).focus();
        }
        else {
            ReactDOM.findDOMNode(this.cancelButton).focus();
        }
    }

    onClickCancel () {
        this.props.cancelCallback();
        this.destroyModal();
    }

    onClickConfirm () {
        this.props.confirmCallback();
        this.destroyModal();
    }

    destroyModal () {
        ReactDOM.unmountComponentAtNode(document.getElementById('modal-container'));
    }

    render () {
        return (
            <Modal className='error-modal' cancelCallback={this.onClickClose}>
                <p className='modal-text'>
                    {this.props.message}
                </p>

                <div className='modal-buttons'>
                    <Button
                        className='modal-cancel'
                        onClick={this.onClickCancel}
                        ref={(ref) => { this.cancelButton = ref; }}
                    >
                        <Icon type={'bt-times'} />
                        Cancel
                    </Button>
                    <Button
                        className='modal-confirm'
                        onClick={this.onClickConfirm}
                        ref={(ref) => { this.confirmButton = ref; }}
                    >
                        <Icon type={'bt-check'} />
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
    focusConfirm: React.PropTypes.bool
};

ConfirmDialogModal.defaultProps = {
    confirmCallback: noop,
    cancelCallback: noop,
    focusConfirm: true
};
