import TangramPlay from '../tangram-play';
import LocalStorage from '../storage/localstorage';
import Modal from './modal';
import ErrorModal from './modal.error';
import Clipboard from 'clipboard';
import { editor } from '../editor/editor';
import { map, getScreenshotData } from '../map/map';
import { getLocationLabel } from '../map/search';
import { getQueryStringObject, serializeToQueryString } from '../tools/helpers';
import { createThumbnail } from '../tools/thumbnail';

const DEFAULT_GIST_SCENE_NAME = 'Tangram scene';
const DEFAULT_GIST_SCENE_FILENAME = 'scene.yaml';
const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';
const STORAGE_SAVED_GISTS = 'gists';
const SAVE_TIMEOUT = 20000; // ms before we assume saving is failure

class SaveGistModal extends Modal {
    constructor () {
        super();

        // Cache elements
        this.el = document.body.querySelector('.save-gist-modal');
        this.nameInput = this.el.querySelector('#gist-name');
        this.descriptionInput = this.el.querySelector('#gist-description');
        this.publicCheckbox = this.el.querySelector('#gist-public');

        // Set default values in UI
        this.nameInput.value = DEFAULT_GIST_SCENE_NAME;
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;

        this.onConfirm = (event) => {
            // Waiting state
            this.waitStateOn();

            // Name of the scene
            let sceneName = this.nameInput.value;
            if (sceneName.length === 0) {
                sceneName = DEFAULT_GIST_SCENE_NAME;
            }

            // Filename
            // Currently, set it to default value.
            // We will re-address filenames in multi-tab scenario.
            let filename = DEFAULT_GIST_SCENE_FILENAME;

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
                description = this.descriptionInput.value + ` [${DEFAULT_GIST_DESCRIPTION}]`;
            }

            // Package up the data we want to post to gist
            // The first step is to grab a screenshot from the map and
            // convert it to a thumbnail at a fixed dimension. This
            // makes file sizes and layout more predictable.
            getScreenshotData().then(screenshot => {
                const THUMBNAIL_WIDTH = 144;
                const THUMBNAIL_HEIGHT = 81;

                return createThumbnail(screenshot.url, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
            }).then(thumbnail => {
                const files = {};
                const metadata = {
                    name: sceneName,
                    view: {
                        label: getLocationLabel(),
                        lat: map.getCenter().lat,
                        lng: map.getCenter().lng,
                        zoom: map.getZoom()
                    },
                    date: new Date().toJSON()
                };

                // This is a single YAML file
                // The key is its filename and it takes a content property
                // We cannot specify MIME type here so filename should have the
                // correct extension (see above)
                files[filename] = {
                    content: TangramPlay.getContent()
                };

                // GitHub Gist does not appear to have a limit on filesize,
                // but this thumbnail image should clock in at around ~90kb to ~120kb
                // (unoptimized, but that's the limitations of our thumbnail function)
                files['thumbnail.png'] = {
                    content: thumbnail
                };

                // Store metadata
                files['.tangramplay'] = {
                    content: JSON.stringify(metadata)
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
                }).then(response => {
                    switch (response.status) {
                        case 201:
                            return response.json();
                        case 403:
                            throw new Error('It looks like somebody (probably not you) was asking GitHub’s servers to do too many things so we’re not allowed to ask them to save your scene right now. Try again a little later when things cool down a bit.');
                        default:
                            throw new Error(`We got a ${response.status} code back from GitHub’s servers and don’t know what to do about it. Sorry, it’s a programmer error!`);
                    }
                }).then(gist => {
                    this.onSaveSuccess({
                        metadata: metadata,
                        gist: gist,
                        thumbnail: thumbnail
                    });
                }).catch(error => {
                    this.onSaveError(error);
                });

                // Start save timeout
                // TODO: This does not cancel the request if it is in progress
                this._timeout = window.setTimeout(() => {
                    this.onSaveError({ message: 'GitHub’s servers haven’t responded in a while, so we’re going stop waiting for them. You might want to try again later!' });
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
        this.nameInput.value = DEFAULT_GIST_SCENE_NAME;
        this.nameInput.blur();
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
    onSaveSuccess (data) {
        const gist = data.gist;

        // Create storage object
        const saveData = {
            name: data.metadata.name,
            description: data.gist.description,
            view: data.metadata.view,
            user: data.gist.user,
            url: data.gist.url,
            public: data.gist.public,
            /* eslint-disable camelcase */
            created_at: data.gist.created_at,
            updated_at: data.gist.updated_at,
            /* eslint-enable camelcase */
            thumbnail: data.thumbnail
        };

        // Store response in localstorage
        LocalStorage.pushItem(STORAGE_SAVED_GISTS, JSON.stringify(saveData));

        // Close the modal
        this.hide();

        // Mark as clean state in the editor
        editor.doc.markClean();

        // Update the page URL. The scene parameter should
        // reflect the new scene URL.
        // TODO: Combine with similar functionality in
        // tangram-play.js updateContent()
        const queryObj = getQueryStringObject();
        queryObj.scene = gist.url;
        const url = window.location.pathname;
        const queryString = serializeToQueryString(queryObj);
        window.history.replaceState({}, null, url + queryString + window.location.hash);

        // Show success modal
        let SaveGistSuccessModal = new Modal(undefined, undefined, undefined, { el: document.body.querySelector('.save-gist-success-modal') });
        SaveGistSuccessModal.urlInput = SaveGistSuccessModal.el.querySelector('#gist-saved-url');
        SaveGistSuccessModal.urlInput.value = gist.url;
        SaveGistSuccessModal.urlInput.readOnly = true;
        SaveGistSuccessModal.show();
        SaveGistSuccessModal.urlInput.select();

        document.querySelector('.gist-saved-copy-btn').focus();

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

    show () {
        super.show();

        // Put the cursor on 'Scene name' immediately
        this.nameInput.focus();
        this.nameInput.select();
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
