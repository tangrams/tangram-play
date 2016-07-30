import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/icon.react';

import Clipboard from 'clipboard';

export default class SaveGistSuggestModal extends React.Component {
    constructor (props) {
        super(props);

        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentDidMount () {
        this.setupClipboard();
        this.urlInput.select();
    }

    onClickConfirm (event) {
        this.destroyModal();
    }

    // Sets up clipboard.js functionality. Not a React component.
    setupClipboard () {
        const clipboardButtonEl = ReactDOM.findDOMNode(this.clipboardButton);

        // Initiate clipboard button
        this.clipboard = new Clipboard(clipboardButtonEl);

        this.clipboard.on('success', function (e) {
            console.info('Action:', e.action);
            console.info('Text:', e.text);
            console.info('Trigger:', e.trigger);

            e.clearSelection();
        });

        this.clipboard.on('error', function (e) {
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });

        clipboardButtonEl.focus();
    }

    destroyModal () {
        this.clipboard.destroy();
        ReactDOM.unmountComponentAtNode(document.getElementById('modal-container'));
    }

    render () {
        return (
            <Modal className='save-gist-success-modal'>
                <div className='modal-content'>
                    <h4>
                        Your gist has been saved.
                    </h4>
                    <p>
                        Remember this URL!
                    </p>
                    <div className='input-bar'>
                        <input
                            type='text'
                            id='gist-saved-url'
                            readOnly='true'
                            ref={(ref) => { this.urlInput = ref; }}
                            defaultValue={this.props.urlValue}
                        />
                        <Button
                            className='gist-saved-copy-btn'
                            data-clipboard-target='#gist-saved-url'
                            data-tooltip='Copy to clipboard'
                            data-tooltip-alignment='right'
                            ref={(ref) => { this.clipboardButton = ref; }}
                        >
                            <Icon type='bt-copy' />
                        </Button>
                    </div>
                </div>
                <div className='modal-buttons'>
                    <Button
                        className='modal-confirm'
                        onClick={this.onClickConfirm}
                    >Got it</Button>
                </div>
            </Modal>
        );
    }
}

SaveGistSuggestModal.propTypes = {
    urlValue: React.PropTypes.string
};
