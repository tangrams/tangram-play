'use strict';
// For now: assume globals
/* global tangramPlay */

import { noop } from './Helpers.js';
import Modal from './Modal.js';

const FileHandler = {
    open (file) {
        this.checkEditorSaveState(() => {
            this.loadContent(file);
        })
    },
    checkEditorSaveState (callback = noop) {
        if (tangramPlay.editor.isSaved === false) {
            const unsavedModal = new Modal('Your style has not been saved. Continue?', callback);
            unsavedModal.show();
        } else {
            callback();
        }
    },
    loadContent (content) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tangramPlay.loadContent(e.target.result);
        }
        reader.readAsText(content);
    }
}

export default FileHandler;
