import TangramPlay from '../tangram-play';
import Modal from './modal';
import ErrorModal from './modal.error';
import EditorIO from '../editor/io';
import { isGistURL, getGistURL } from '../tools/gist-url';

class OpenUrlModal extends Modal {
    constructor () {
        const message = 'Open a scene file from URL';
        // const el = document.body.querySelector('.open-url-modal');

        const onConfirm = () => {
            let value = this.input.value.trim();

            // If it appears to be a Gist URL:
            if (isGistURL(value) === true) {
                this.fetchGistURL(value);
            }
            else {
                this.openUrl(value);
            }
        }

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
        // Grab the manifest from the API.
        url = getGistURL(url);
        this.waitStateOn();

        window.fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('This Gist could not be found.');
                    }
                    else {
                        throw new Error(`The Gist server gave us an error code of ${response.status}`);
                    }
                }
                return response.json();
            })
            .then(gist => {
                let yamlFile;

                // Iterate through gist.files, an object whose keys are the filenames of each file.
                // Find the first file with type "text/x-yaml".
                for (let id in gist.files) {
                    const file = gist.files[id];
                    if (file.type === 'text/x-yaml') {
                        yamlFile = file;
                        break;
                    }
                }

                // In the future, we will have to be smarter than this -- there might be
                // multiple files, or it might be in a different format. But for now,
                // we assume there's one Tangram YAML file and that the MIME-type is correct.

                if (!yamlFile) {
                    throw new Error('This Gist URL doesn’t appear to have a YAML file in it!');
                }
                else {
                    // Grab that file's raw_url property and read it in.
                    // This preserves the original URL location, which is preferable
                    // for Tangram. Don't read the "content" property directly because
                    // (a) it may be truncated and (b) we would have to construct a Blob
                    // URL for it anyway for Tangram, so there's no use saving an HTTP
                    // request here.
                    this.openUrl(yamlFile.raw_url);
                }
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

    // If not successful, turn off wait state,
    // and display the error message.
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
