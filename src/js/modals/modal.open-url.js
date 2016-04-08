import TangramPlay from '../tangram-play';
import Modal from './modal';
import EditorIO from '../editor/io';
import { parseForGistURL, isGistURL } from '../tools/gist-url';

let modalEl;

class OpenUrlModal extends Modal {
    constructor () {
        super();

        this.el = modalEl = document.body.querySelector('.open-url-modal');
        this.message = 'Open a scene file from URL';
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

        this.onConfirm = () => {
            let value = this.input.value.trim();
            value = parseForGistURL(value);
            // TODO: If it's a Gist URL:
            // Grab the manifest from the API. (We'll call the response object "gist")
            // Iterate through gist.files, an object whose keys are the filenames of each file.
            // Find the first file with type "text/x-yaml".
            //      gist.files[file].type === 'text/x-yaml'
            // In the future, we will have to be smarter than this -- there might be
            // multiple files, or it might be in a different format. But for now,
            // we assume there's one Tangram YAML file and that the MIME-type is correct.
            // Grab that file's raw_url property and read it in.
            // Alternatively, the content property might be read directly (if truncated is false)?
            // Because this requires several successive API calls, we need to wrap
            // TangramPlay.load() in a Promise wrapper.

            this.clearInput();
            TangramPlay.load({ url: value });
        };

        this.onAbort = () => {
            this.clearInput();
        };
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
}

export const openURLModal = new OpenUrlModal();
