import _ from 'lodash';
import TangramPlay from '../tangram-play';
import Modal from './modal';
import ErrorModal from './modal.error';
import EditorIO from '../editor/io';
import LocalStorage from '../storage/localstorage';
import { getSceneURLFromGistAPI } from '../tools/gist-url';
import { emptyDOMElement } from '../tools/helpers';

const STORAGE_SAVED_GISTS = 'gists';

class OpenGistModal extends Modal {
    constructor () {
        const message = 'Open a previously saved Gist';
        const onConfirm = () => {
            const selected = this.el.querySelectorAll('.open-gist-option.open-gist-selected')[0];
            const value = selected.getAttribute('data-value');

            getSceneURLFromGistAPI(value)
                .then(url => {
                    TangramPlay.load({ url });
                })
                .catch(error => {
                    this._onError(error, value);
                });
        };
        const onAbort = () => {
            this._resetExampleSelection();
            this.el.querySelector('.modal-confirm').disabled = true;
        };

        super(message, onConfirm, onAbort, {
            el: document.body.querySelector('.open-gist-modal')
        });
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();

            // Always load new set of saved Gists from memory each
            // time this modal is opened, in case it has changed
            // during use
            this._loadSavedGists();
        });
    }

    _loadSavedGists () {
        // Get what's in LocalStorage
        const gists = JSON.parse(LocalStorage.getItem(STORAGE_SAVED_GISTS));
        const listEl = this.el.querySelector('.open-gist-list');

        if (!gists) {
            listEl.appendChild(document.createTextNode('No gists have been saved!'));
            return;
        }

        // Clear what's in the list element first
        emptyDOMElement(listEl);

        // Reverse-sort the gists; most recent will display up top
        _.reverse(gists.arr);

        for (let item of gists.arr) {
            const newOption = document.createElement('div');
            newOption.className = 'open-gist-option';

            // We have two types of things in this array.
            // LEGACY: it's just a string for the gist URL.
            // CURRENT: an object that has information in it.
            // We'll try to JSON.parse the item first; if it works,
            // then we can create a new entry for it. Otherwise,
            // fallback to the string-only url.
            let gist;
            let isLegacy;
            try {
                gist = JSON.parse(item);
                isLegacy = false;
            }
            // Not JSON-parseable; LEGACY gist url format.
            catch (e) {
                gist = item;
                isLegacy = true;
            }

            if (isLegacy === false) {
                // TODO:
                // There is actually a lot more info stored than is currently being
                // displayed. We have date, user, public gist or not, and map view.
                const thumbnailImgEl = new Image();
                thumbnailImgEl.src = gist.thumbnail;

                // A container element for the image is necessary for us to be
                // able to do border highlighting around it
                const thumbnailContainerEl = document.createElement('div');
                thumbnailContainerEl.className = 'open-gist-option-thumbnail';
                thumbnailContainerEl.appendChild(thumbnailImgEl);

                const infoEl = document.createElement('div');
                infoEl.className = 'open-gist-option-info';

                const nameEl = document.createElement('div');
                nameEl.className = 'open-gist-option-name';
                nameEl.textContent = gist.name;

                const descriptionEl = document.createElement('div');
                descriptionEl.className = 'open-gist-option-description';

                // TODO: don't hardcode
                const descPlaceholder = '[This is a Tangram scene, made with Tangram Play.]';
                let description = gist.description.replace(descPlaceholder, '');
                if (description.length === 0) {
                    descriptionEl.textContent = 'No description provided.';
                }
                else {
                    descriptionEl.textContent = description;
                }

                // Show the date this was saved. TODO: better formatting;
                // maybe use moment.js
                const dateEl = document.createElement('div');
                dateEl.className = 'open-gist-option-date';
                dateEl.textContent = 'Saved on ' + new Date(gist['created_at']).toLocaleString();

                infoEl.appendChild(nameEl);
                infoEl.appendChild(descriptionEl);
                infoEl.appendChild(dateEl);

                newOption.setAttribute('data-value', gist.url);

                newOption.appendChild(thumbnailContainerEl);
                newOption.appendChild(infoEl);
            }
            else {
                const nameEl = document.createElement('div');
                nameEl.className = 'open-gist-option-legacy-name';
                nameEl.textContent = gist;

                newOption.setAttribute('data-value', gist);
                newOption.appendChild(nameEl);
            }

            newOption.addEventListener('click', event => {
                this._selectExample(event.target);
            });

            listEl.appendChild(newOption);

            newOption.addEventListener('dblclick', event => {
                this._handleConfirm();
            });
        }
    }

    _selectExample (target) {
        while (!target.classList.contains('open-gist-option')) {
            target = target.parentNode;
        }
        this._resetExampleSelection();
        target.classList.add('open-gist-selected');
        this.el.querySelector('.modal-confirm').disabled = false;
    }

    _resetExampleSelection () {
        const allOptions = this.el.querySelectorAll('.open-gist-option');
        for (let option of allOptions) {
            option.classList.remove('open-gist-selected');
        }
    }

    /**
     * If opening a URL is not successful
     *
     * @param {Error} error - thrown by something else
     *    if error.message is a number, then it is a status code from Fetch
     *    but status code numbers are converted to strings
     *    there must be a better way of doing this
     * @param {string} url - the Gist URL that was attempted
     */
    _onError (error, url) {
        // Close the modal
        this.hide();

        let message = '';

        if (error.message === '404') {
            message = 'This Gist could not be found.';
        }
        else if (error.message === '403') {
            message = 'We exceeded the rate limit for GitHub’s non-authenticated request API.';
        }
        else if (Number.isInteger(window.parseInt(error.message, 10))) {
            message = `The Gist server gave us an error code of ${error.message}`;
        }

        // Show error modal
        const errorModal = new ErrorModal(`Could not load the Gist! ${message}`);
        errorModal.show();

        if (error.message === '404') {
            removeNonexistentGistFromLocalStorage(url);
        }
    }
}

// Instantiate this modal ASAP and export it!
export const openGistModal = new OpenGistModal();

function removeNonexistentGistFromLocalStorage (url) {
    const gists = JSON.parse(LocalStorage.getItem(STORAGE_SAVED_GISTS));

    // Filter the unfound gist URL from the gist list
    gists.arr = _.reject(gists.arr, (str) => {
        return str === url;
    });

    LocalStorage.setItem(STORAGE_SAVED_GISTS, JSON.stringify(gists));
}
