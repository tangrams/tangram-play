import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';

import { EventEmitter } from '../components/event-emitter';
import { getUserLogin } from '../user/login';

/**
 * This modal loads mapzen.com's login flow into an iframe, so it outsources
 * as much of it as possible out of Tangram Play. When the iframe source looks
 * like the user has successfully signed in / signed up, we toggle the state
 * on the login window and the user log in state in the application.
 * Due to web security restrictions, this must be tested on mapzen.com and
 * should not be loaded in other contexts (e.g. localhost)
 */

export default class SignInModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            thinking: false,
            loggedIn: false
        };

        this.onClickConfirm = this.onClickConfirm.bind(this);
        this.onClickCancel = this.onClickCancel.bind(this);
        this.onLoadIframe = this.onLoadIframe.bind(this);
    }

    onClickConfirm () {
        EventEmitter.dispatch('mapzen:sign_in', {});
        this.destroyModal();
    }

    onClickCancel (event) {
        this.destroyModal();
    }

    onLoadIframe (event) {
        // This event is fired whenever the iframe location changes.

        // Experimental: adjust iframe content.
        adjustIframeContent(this.iframe.contentWindow.document);
        this.iframe.style.opacity = 1;

        // We then query the server to see if user has logged in.
        getUserLogin().then((data) => {
            // If a user is not logged in, data object is empty.
            if (data.id) {
                // Display toast
                // Or auto confirm
                this.setState({ loggedIn: true });
                this.onClickConfirm();
            }
        });
    }

    destroyModal () {
        ReactDOM.unmountComponentAtNode(document.getElementById('modal-container'));
    }

    // TODO: Iframe needs to be on same origin for it to work.

    render () {
        return (
            <Modal
                className='modal-sign-in'
                disableEsc={this.state.thinking}
                cancelFunction={this.onClickCancel}
            >
                <h4>Sign in to your Mapzen developer account</h4>

                <div className='modal-content'>
                    <iframe
                        className='modal-sign-in-iframe'
                        src='/developers/sign_in'
                        ref={(ref) => { this.iframe = ref; }}
                        onLoad={this.onLoadIframe}
                    />
                </div>

                <div className='modal-buttons'>
                    <Button
                        className='modal-cancel'
                        disabled={this.state.thinking}
                        ref={(ref) => { this.cancelButton = ref; }}
                        onClick={this.onClickCancel}
                        style={{ display: this.state.loggedIn ? 'none' : 'block' }}
                    >
                        <Icon type={'bt-times'} /> Cancel
                    </Button>
                    <Button
                        className='modal-confirm'
                        disabled={this.state.thinking}
                        ref={(ref) => { this.confirmButton = ref; }}
                        onClick={this.onClickConfirm}
                        style={{ display: this.state.loggedIn ? 'block' : 'none' }}
                    >
                        <Icon type={'bt-check'} /> Continue
                    </Button>
                </div>
            </Modal>
        );
    }
}

function adjustIframeContent (frameDocument) {
    const newStyleEl = document.createElement('style');
    // SUPER HACKY! But it's an experiment.
    const newStyleText = `
        body {
            margin-top: 0;
            overflow: hidden;
        }
        h1 {
            display: none;
        }
        h3 {
            line-height: 1.4em;
            margin-bottom: 20px;
        }
        body.hide-fixed-main-nav nav.navbar-fixed-top {
            top: 0;
        }
        nav.navbar.navbar-default.navbar-fixed-top {
            position: absolute;
        }
        .navbar-collapse.navbar-collapse.navbar-collapse {
            display: none !important;
        }
        a.navbar-brand {
            left: 50%;
            position: absolute;
            margin-left: -80px !important;
            pointer-events: none;
            user-select: none;
            touch-action: none;
        }
        .headroom-extra-large {
            margin-top: 20px;
        }
        footer {
            display: none;
        }
        #dev_login.container {
            position: absolute;
            bottom: 0;
            top: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            left: 0;
            width: 100%;
            max-width: 100%;
        }
        @media (max-height: 500px) {
            #dev_login.container {
                top: 0;
                transform: scale(.80);
            }
        }
        button.navbar-toggle {
            display: none;
        }
    `;

    if (frameDocument.querySelector('#dev_login')) {
        newStyleEl.textContent = newStyleText;

        frameDocument.head.appendChild(newStyleEl);
        frameDocument.querySelector('h3').textContent = 'You can save Tangram scenes to your Mapzen account and do other stuff good too';
    }
}
