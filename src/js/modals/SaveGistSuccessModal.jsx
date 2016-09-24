import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Clipboard from 'clipboard';

import Modal from './Modal';
import Icon from '../components/Icon';

export default class SaveGistSuccessModal extends React.Component {
    constructor(props) {
        super(props);

        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentDidMount() {
        this.setupClipboard();
        this.urlInput.select();
    }

    componentWillUnmount() {
        // Clean up clipboard object
        this.clipboard.destroy();
    }

    onClickConfirm(event) {
        this.component.unmount();
    }

    // Sets up clipboard.js functionality. Not a React component.
    setupClipboard() {
        // eslint-disable-next-line react/no-find-dom-node
        const clipboardButtonEl = ReactDOM.findDOMNode(this.clipboardButton);

        // Initiate clipboard button
        this.clipboard = new Clipboard(clipboardButtonEl);

        this.clipboard.on('success', (e) => {
            console.info('Action:', e.action);
            console.info('Text:', e.text);
            console.info('Trigger:', e.trigger);

            e.clearSelection();
        });

        this.clipboard.on('error', (e) => {
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });

        clipboardButtonEl.focus();
    }

    render() {
        return (
            <Modal
                className="save-to-cloud-success-modal"
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickConfirm}
            >
                <div className="modal-content">
                    <h4>
                        Your gist has been saved.
                    </h4>
                    <p>
                        Remember this URL!
                    </p>
                    <div className="input-bar">
                        <input
                            type="text"
                            id="gist-saved-url"
                            readOnly="true"
                            ref={(ref) => { this.urlInput = ref; }}
                            defaultValue={this.props.urlValue}
                        />
                        <OverlayTrigger
                            rootClose
                            placement="right"
                            overlay={<Tooltip id="tooltip">Copy to clipboard</Tooltip>}
                        >
                            <Button
                                className="saved-scene-copy-btn"
                                data-clipboard-target="#gist-saved-url"
                                ref={(ref) => { this.clipboardButton = ref; }}
                            >
                                <Icon type="bt-copy" />
                            </Button>
                        </OverlayTrigger>
                    </div>
                </div>
                <div className="modal-buttons">
                    <Button className="button-confirm" onClick={this.onClickConfirm}>
                        Got it
                    </Button>
                </div>
            </Modal>
        );
    }
}

SaveGistSuccessModal.propTypes = {
    urlValue: React.PropTypes.string,
};
