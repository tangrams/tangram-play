import TangramPlay, { editor } from '../../tangram-play';
import LocalStorage from '../LocalStorage';
import Modal from './Modal';
import xhr from 'xhr';
import Clipboard from 'clipboard';

const DEFAULT_GIST_SCENE_FILENAME = 'scene.yaml';
const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';
const STORAGE_SAVED_GISTS = 'gists';
const SAVE_TIMEOUT = 6000; // ms before we assume saving is failure

export default class SaveGistModal extends Modal {
    constructor () {
        super();

        // Cache elements
        this.el = document.body.querySelector('.save-gist-modal');
        this.filenameInput = this.el.querySelector('#gist-filename');
        this.descriptionInput = this.el.querySelector('#gist-description');
        this.publicCheckbox = this.el.querySelector('#gist-public');

        // Set default values in UI
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.filenameInput.value = DEFAULT_GIST_SCENE_FILENAME;

        this.onConfirm = (event) => {
            // Waiting state
            this.waitStateOn();

            // Blank filename is set to default value
            if (this.filenameInput.value.length === 0) {
                this.filenameInput.value = DEFAULT_GIST_SCENE_FILENAME;
            }

            // Description is either set to default (if blank)
            // or appended to the user-produced value
            let description;
            if (this.descriptionInput.value.length === 0 || this.descriptionInput.value.trim() === DEFAULT_GIST_DESCRIPTION) {
                description = `[${DEFAULT_GIST_DESCRIPTION}]`;
            }
            else {
                // Newlines are not accepted on gist descriptions, apparently.
                description = this.descriptionInput.value + `[${DEFAULT_GIST_DESCRIPTION}]`;
            }

            // Package up the data we want to post to gist
            let data = {
                description: description,
                public: this.publicCheckbox.checked,
                files: [{
                    filename: this.filenameInput.value,
                    content: TangramPlay.getContent()
                }]
            };

            // Make the post
            xhr.post({
                url: 'https://api.github.com/gists',
                body: formatGistPayload(data)
            }, (error, response, body) => {
                if (error) {
                    return this.onSaveError(error);
                }

                switch (response.statusCode) {
                    case 201:
                        this.onSaveSuccess(JSON.parse(response.body));
                        break;
                    case 403:
                        this.onSaveError('API limit reached. Please try again later.');
                        break;
                    default:
                        this.onSaveError(`Response ${response.statusCode} obtained but there is nothing to handle it.`);
                        break;
                }
            });

            // Start save timeout
            this._timeout = window.setTimeout(() => {
                this.onSaveError('Timed out trying to contact the gist server.');
            }, SAVE_TIMEOUT);
        };

        this.onAbort = (event) => {
            this.resetInputs();
            this.waitStateOff();
            window.clearTimeout(this._timeout);
        };
    }

    resetInputs () {
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.descriptionInput.blur();
        this.publicCheckbox.checked = true;
        this.publicCheckbox.blur();
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

    // If successful, turn off wait state,
    // mark as clean state in the editor,
    // remember the success response,
    // and display a helpful message
    onSaveSuccess (gist) {
        // Store response in localstorage
        LocalStorage.pushItem(STORAGE_SAVED_GISTS, gist.url);

        // Turn on wait state and close the modal
        this.waitStateOff();
        this.hide();
        window.clearTimeout(this._timeout);

        // Mark as clean state in the editor
        editor.doc.markClean();

        // Show success modal
        let SaveGistSuccessModal = new Modal(undefined, undefined, undefined, { el: document.body.querySelector('.save-gist-success-modal') });
        SaveGistSuccessModal.urlInput = SaveGistSuccessModal.el.querySelector('#gist-saved-url');
        SaveGistSuccessModal.urlInput.value = gist.url;
        SaveGistSuccessModal.show();
        SaveGistSuccessModal.urlInput.select();

        // Initiate clipboard button
        var clipboard = new Clipboard('.gist-saved-copy-btn');

        clipboard.on('success', function (e) {
            console.info('Action:', e.action);
            console.info('Text:', e.text);
            console.info('Trigger:', e.trigger);

            e.clearSelection();
        });

        clipboard.on('error', function (e) {
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });

        SaveGistSuccessModal.onConfirm = () => {
            clipboard.destroy();
        };
    }

    // If not successful, turn off wait state,
    // and display the error message.
    onSaveError (error) {
        // Turn off wait state and close the modal
        this.waitStateOff();
        this.hide();
        window.clearTimeout(this._timeout);

        // Show error modal
        const errorModal = new Modal(`There was an error saving your scene: ${error}`);
        errorModal.show();
    }

    _handleConfirm (event) {
        // Override default behavior: do not hide modal immediately.
        this.onConfirm(event);
    }
}

//     constructor () {
//         super();

//         // Cache elements
//         this.el = document.body.querySelector('.save-gist-success-modal');
//         this.urlInput = this.el.querySelector('#gist-saved-url');
//     }

//     show (url) {
//         super.show();
//         this.urlInput.value = url;
//     }
// }

// POSTing to /gists API requires a JSON blob of MIME type 'application/json'
function formatGistPayload (data) {
    let payload = {
        description: data.description,
        public: data.public,
        files: {}
    };
    for (let file of data.files) {
        payload.files[file.filename] = {
            content: file.content
        };
    }
    return JSON.stringify(payload);
}
