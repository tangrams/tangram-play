import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Clipboard from 'clipboard';

import Modal from './Modal';
import Icon from '../components/Icon';

export default class SaveToCloudSuccessModal extends React.Component {
    constructor(props) {
        super(props);

        this.onClickConfirm = this.onClickConfirm.bind(this);
        this.onClickViewUrl = this.onClickViewUrl.bind(this);
    }

    componentDidMount() {
        this.setupClipboard();
        this.viewUrl.select();
    }

    componentWillUnmount() {
        // Clean up clipboard object
        this.clipboard.destroy();
    }

    onClickConfirm(event) {
        this.component.unmount();
    }

    onClickViewUrl() {
        const newTab = window.open(this.viewUrl.value, 'tangram-viewer');
        if (newTab) {
            newTab.focus();
        }
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
                        Your scene has been saved!
                    </h4>
                    <p>
                        Share your scene with the link below.
                    </p>

                    <div className="input-bar">
                        <input
                            id="saved-scene-url"
                            type="text"
                            readOnly="true"
                            ref={(ref) => { this.viewUrl = ref; }}
                            defaultValue={`https://dev.mapzen.com/tangram/view/?scene=${this.props.urlValue}${window.location.hash}`}
                        />
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">Copy to clipboard</Tooltip>}
                        >
                            <Button
                                className="saved-scene-copy-btn button-icon"
                                data-clipboard-target="#saved-scene-url"
                                ref={(ref) => { this.clipboardButton = ref; }}
                            >
                                <Icon type="bt-copy" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">View in new tab</Tooltip>}
                        >
                            <Button
                                className="saved-scene-copy-btn button-icon"
                                onClick={this.onClickViewUrl}
                            >
                                <Icon type="bt-external-link" />
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

SaveToCloudSuccessModal.propTypes = {
    urlValue: React.PropTypes.string,
};
