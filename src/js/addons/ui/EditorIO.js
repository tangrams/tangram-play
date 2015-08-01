'use strict';

import TangramPlay from '../../TangramPlay.js';
import { saveAs } from '../../vendor/FileSaver.min.js';
import { noop } from './Helpers.js';
import Modal from './Modal.js';

const EditorIO = {
    open (file) {
        this.checkSaveStateThen(() => {
            this.loadContent(file);
        });
    },
    new () {
        this.checkSaveStateThen(() => {
            this.newContent();
        });
    },
    export () {
        const typedArray = TangramPlay.getContent();
        const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'style.yaml');
        TangramPlay.editor.isSaved = true;
    },
    checkSaveStateThen (callback = noop) {
        if (TangramPlay.editor.isSaved === false) {
            const unsavedModal = new Modal('Your style has not been saved. Continue?', callback);
            unsavedModal.show();
        }
        else {
            callback();
        }
    },
    newContent () {
        // TODO: Don't hack
        window.location.href = '.';
    },
    loadContent (content) {
        const reader = new FileReader();
        reader.onload = function (event) {
            TangramPlay.loadContent(event.target.result);
        };
        reader.readAsText(content);
    }
};

export default EditorIO;
