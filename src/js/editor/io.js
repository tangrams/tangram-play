import _ from 'lodash';
import TangramPlay from '../tangram-play';
import { editor, getEditorContent } from './editor';
import { saveAs } from '../vendor/FileSaver.min.js';
import Modal from '../modals/modal';

const NEW_SCENE_PATH = 'data/scenes/empty.yaml';

const EditorIO = {
    open (file) {
        this.checkSaveStateThen(() => {
            this.loadContentFromFile(file);
        });
    },
    new () {
        this.checkSaveStateThen(() => {
            TangramPlay.load({ url: NEW_SCENE_PATH });
        });
    },
    export () {
        const typedArray = getEditorContent();
        const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'scene.yaml');
        editor.doc.markClean();
    },
    checkSaveStateThen (callback = _.noop) {
        if (editor.doc.isClean()) {
            callback();
        }
        else {
            const unsavedModal = new Modal('Your scene has not been saved. Continue?', callback);
            unsavedModal.show();
            unsavedModal.confirmButton.focus();
        }
    },
    loadContentFromFile (content) {
        const reader = new FileReader();
        reader.onload = function (event) {
            TangramPlay.load({ contents: event.target.result });
        };
        reader.readAsText(content);
    }
};

export default EditorIO;
