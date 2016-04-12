import TangramPlay, { editor } from '../tangram-play';
import LocalStorage from '../storage/localstorage';
import Modal from './modal';
import ErrorModal from './modal.error';
import Clipboard from 'clipboard';
import { getScreenshotData } from '../map/map';

const DEFAULT_GIST_SCENE_FILENAME = 'scene.yaml';
const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';
const STORAGE_SAVED_GISTS = 'gists';
const SAVE_TIMEOUT = 6000; // ms before we assume saving is failure

class SaveGistModal extends Modal {
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

            // Only read from the filename input once
            let filename = this.filenameInput.value;

            // Blank filename is set to default value
            if (filename.length === 0) {
                filename = DEFAULT_GIST_SCENE_FILENAME;
            }

            // Append ".yaml" to the end of a filename if it does not
            // end with either ".yaml" or ".yml". GitHub Gist needs this
            // extension to properly detect the MIME type. (As of this
            // writing, the Gist API POST payload does not allow you to
            // specify the MIME-type of a file.)
            if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
                filename += '.yaml';
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
            // TODO: Screenshot / thumbnail should be a fixed
            // size and dimension. This makes saving and loading
            // much more predictable.
            getScreenshotData().then(screenshot => {
                const files = {};

                // This is a single YAML file
                // The key is its filename and it takes a content property
                // We cannot specify MIME type here so filename should have the
                // correct extension (see above)
                files[filename] = {
                    content: TangramPlay.getContent()
                };

                // TODO: Does GitHub Gist have a limit on filesize?
                // Test is currently ~900kb and it worked
                files['screenshot.png'] = {
                    content: screenshot.url
                };

                const data = {
                    description: description,
                    public: this.publicCheckbox.checked,
                    files: files
                };

                // Make the post
                window.fetch('https://api.github.com/gists', {
                    method: 'POST',
                    // POSTing to /gists API requires a JSON blob of
                    // MIME-type 'application/json'
                    body: JSON.stringify(data)
                }).then((response) => {
                    switch(response.status) {
                        case 201:
                            return response.json();
                        case 403:
                            throw new Error('It looks like somebody (probably not you) was asking GitHub’s servers to do too many things so we’re not allowed to ask them to save your scene right now. Try again a little later when things cool down a bit.');
                        default:
                            throw new Error(`We got a ${response.status} code back from GitHub’s servers and don’t know what to do about it. Sorry, it’s a programmer error!`);
                    }
                }).then((data) => {
                    this.onSaveSuccess(data);
                }).catch((error) => {
                    this.onSaveError(error);
                });

                // Start save timeout
                this._timeout = window.setTimeout(() => {
                    this.onSaveError('GitHub’s servers haven’t responded in a while, so we’re going stop waiting for them. You might want to try again later!');
                }, SAVE_TIMEOUT);
            });
        };

        this.onAbort = (event) => {
            this.resetInputs();
            window.clearTimeout(this._timeout);
        };
    }

    /**
     * Called when modal is canceled or save is aborted.
     * This resets the inputs to its initial state.
     * Do not call this if save is successful. This is because
     * a user might want to have follow up saves where the same
     * settings might be used.
     */
    resetInputs () {
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.descriptionInput.blur();
        this.filenameInput.value = DEFAULT_GIST_SCENE_FILENAME;
        this.filenameInput.blur();
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

        // Close the modal
        this.hide();

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

    /**
     * If opening a URL is not successful, turn off wait state,
     * and display the error message.
     *
     * @param {Error} Thrown by something else
     */
    onSaveError (error) {
        // Close the modal
        this.hide();

        // Show error modal
        const errorModal = new ErrorModal(`Uh oh! We tried to save your scene but something went wrong. ${error.message}`);
        errorModal.show();
    }

    hide () {
        super.hide();

        this.waitStateOff();
        window.clearTimeout(this._timeout);
    }

    _handleConfirm (event) {
        // Override default behavior: do not hide modal immediately.
        this.onConfirm(event);
    }
}

export const saveGistModal = new SaveGistModal();
