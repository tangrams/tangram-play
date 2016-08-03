import React from 'react';
import ReactDOM from 'react-dom';
import TangramPlay from '../tangram-play';
import Modal from './modal-old';
import ErrorModal from './ErrorModal';
import EditorIO from '../editor/io';

class OpenUrlModal extends Modal {
    constructor () {
        const message = 'Open a scene file from URL';
        const onConfirm = () => {
            this.waitStateOn();

            const value = this.input.value.trim();
            this.openUrl(value);
        };
        const onAbort = () => {
            this.clearInput();
        };

        super(message, onConfirm, onAbort, {
            el: document.body.querySelector('.open-url-modal')
        });

        this.input = this.el.querySelector('.open-url-input input');
        this.input.addEventListener('keyup', (event) => {
            // We no longer check for valid URL signatures.
            // It is easier to attempt to fetch an input URL and see what happens.
            if (this.input.value) {
                this.el.querySelector('.modal-confirm').removeAttribute('disabled');

                const key = event.keyCode || event.which;
                if (key === 13) {
                    this._handleConfirm();
                }
            }
            else {
                this.el.querySelector('.modal-confirm').disabled = true;
            }
        });
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
            this.input.focus();
        });
    }

    clearInput () {
        this.input.value = '';
        this.input.blur();
        this.el.querySelector('.modal-confirm').disabled = true;
    }

    waitStateOn () {
        this.el.querySelector('.modal-thinking').classList.add('modal-thinking-cap-on');
        this.el.querySelector('.modal-confirm').disabled = true;
        this.el.querySelector('.modal-cancel').disabled = true;
        this.options.disableEsc = true;
    }

    waitStateOff () {
        this.el.querySelector('.modal-thinking').classList.remove('modal-thinking-cap-on');
        this.el.querySelector('.modal-confirm').removeAttribute('disabled');
        this.el.querySelector('.modal-cancel').removeAttribute('disabled');
        this.options.disableEsc = false;
    }

    openUrl (url) {
        this.waitStateOff();
        this.clearInput();
        TangramPlay.load({ url });
    }

    /**
     * If opening a URL is not successful, turn off wait state,
     * and display the error message.
     *
     * @param {Error} Thrown by something else
     */
    onGetError (error) {
        // Turn off wait state and close the modal
        this.waitStateOff();
        this.hide();
        window.clearTimeout(this._timeout);

        // Show error modal
        ReactDOM.render(<ErrorModal error={`Something went wrong. ${error.message}`} />, document.getElementById('modal-container'));
    }
}

export const openURLModal = new OpenUrlModal();
