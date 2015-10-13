'use strict';

import TangramPlay from 'app/TangramPlay';
import { editor } from 'app/TangramPlay';
import { saveAs } from 'app/vendor/FileSaver.min.js';
import { noop } from 'app/addons/ui/Helpers';
import Modal from 'app/addons/ui/Modal';

const NEW_STYLE_PATH = 'data/styles/empty.yaml';

const EditorIO = {
    open (file) {
        this.checkSaveStateThen(() => {
            this.loadContentFromFile(file);
        });
    },
    new () {
        this.checkSaveStateThen(() => {
            this.loadContentFromPath(NEW_STYLE_PATH);
        });
    },
    export () {
        const typedArray = TangramPlay.getContent();
        const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'style.yaml');
        editor.doc.markClean();
    },
    checkSaveStateThen (callback = noop) {
        if (editor.doc.isClean()) {
            callback();
        }
        else {
            const unsavedModal = new Modal('Your style has not been saved. Continue?', callback);
            unsavedModal.show();
        }
    },
    loadContentFromPath (path) {
        window.history.pushState({
            loadStyleURL: path
        }, null, '.?style=' + path + window.location.hash);
        TangramPlay.loadQuery();
    },
    loadContentFromFile (content) {
        const reader = new FileReader();
        reader.onload = function (event) {
            window.history.pushState({
                loadStyleURL: null
            }, null, '.' + window.location.hash);
            TangramPlay.loadContent(event.target.result);
        };
        reader.readAsText(content);
    }
};

export default EditorIO;
