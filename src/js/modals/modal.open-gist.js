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

        for (let url of gists.arr) {
            const newOption = document.createElement('div');
            const nameEl = document.createElement('div');

            newOption.className = 'open-gist-option';
            newOption.setAttribute('data-value', url);

            nameEl.className = 'open-gist-option-name';
            nameEl.textContent = url;

            newOption.appendChild(nameEl);
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
