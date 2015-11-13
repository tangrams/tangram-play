'use strict';

import TangramPlay, { container, editor } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';

const DEFAULT_GIST_SCENE_FILENAME = 'scene.yaml';
const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';

export default class SaveGistModal extends Modal {
    constructor () {
        super();

        // Cache elements
        this.el = container.querySelector('.tp-save-gist-modal');
        this.filenameInput = this.el.querySelector('#gist-filename');
        this.descriptionInput = this.el.querySelector('#gist-description');
        this.publicCheckbox = this.el.querySelector('#gist-public');

        // Set default values in UI
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.filenameInput.value = DEFAULT_GIST_SCENE_FILENAME;

        this.onConfirm = () => {
            // Waiting state
            this.waitStateOn();

            // Blank inputs are set to default values
            if (this.filenameInput.value.length === 0) {
                this.filenameInput.value = DEFAULT_GIST_SCENE_FILENAME;
            }
            if (this.descriptionInput.value.length === 0) {
                this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
            }

            // Package up the data we want to post to gist
            let data = {
                description: this.descriptionInput.value,
                public: this.publicCheckbox.checked,
                files: [{
                    filename: this.filenameInput.value,
                    content: TangramPlay.getContent()
                }]
            };
            let payload = formatGistPayload(data);
            console.log(payload);

            this.waitStateOff();

            // Mark as clean state in the editor
            editor.doc.markClean();
        };

        this.onAbort = () => {
            this.resetInputs();
            this.waitStateOff();
        };
    }

    resetInputs () {
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.descriptionInput.blur();
        this.publicCheckbox.checked = true;
        this.publicCheckbox.blur();
    }

    waitStateOn () {
        this.el.querySelector('.tp-modal-thinking').classList.add('tp-modal-thinking-cap-on');
        this.el.querySelector('.tp-modal-confirm').disabled = true;
        this.el.querySelector('.tp-modal-cancel').disabled = true;
    }

    waitStateOff () {
        this.el.querySelector('.tp-modal-thinking').classList.remove('tp-modal-thinking-cap-on');
        this.el.querySelector('.tp-modal-confirm').removeAttribute('disabled');
        this.el.querySelector('.tp-modal-cancel').removeAttribute('disabled');
    }

}

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
