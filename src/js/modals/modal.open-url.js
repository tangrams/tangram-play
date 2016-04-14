import TangramPlay from '../tangram-play';
import Modal from './modal';
import ErrorModal from './modal.error';
import EditorIO from '../editor/io';
import { isGistURL, getSceneURLFromGistAPI } from '../tools/gist-url';

class OpenUrlModal extends Modal {
    constructor () {
        const message = 'Open a scene file from URL';
        const onConfirm = () => {
            let value = this.input.value.trim();

            // If it appears to be a Gist URL:
            if (isGistURL(value) === true) {
                this.fetchGistURL(value);
            }
            else {
                this.openUrl(value);
            }
        };
        const onAbort = () => {
            this.clearInput();
        };

        super(message, onConfirm, onAbort, {
            el: document.body.querySelector('.open-url-modal')
        });

        this.input = this.el.querySelector('.open-url-input input');
        this.input.addEventListener('keyup', (event) => {
            // Check for valid URL.
            // Reported as valid by the form element AND
            // either ends with a YAML extension or matches a Gist URL
            if (this.input.value && this.input.validity.valid === true &&
                (this.input.value.match(/\.y(a?)ml$/) ||
                isGistURL(this.input.value))) {
                this.el.querySelector('.modal-confirm').removeAttribute('disabled');
                let key = event.keyCode || event.which;
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

    fetchGistURL (url) {
        this.waitStateOn();

        getSceneURLFromGistAPI(url)
            .then(url => {
                this.openUrl(url);
            })
            .catch(error => {
                this.onGetError(error);
            });
    }

    openUrl (url) {
        this.waitStateOff();
        this.clearInput();
        TangramPlay.load({ url: url });
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
        const errorModal = new ErrorModal(`Something went wrong. ${error.message}`);
        errorModal.show();
    }
}

export const openURLModal = new OpenUrlModal();
