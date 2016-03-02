import TangramPlay, { editor } from 'app/TangramPlay';
import { saveAs } from 'app/vendor/FileSaver.min.js';
import { noop } from 'app/addons/ui/Helpers';
import Modal from 'app/addons/ui/Modal';

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
        const typedArray = TangramPlay.getContent();
        const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'scene.yaml');
        editor.doc.markClean();
    },
    checkSaveStateThen (callback = noop) {
        if (editor.doc.isClean()) {
            callback();
        }
        else {
            const unsavedModal = new Modal('Your scene has not been saved. Continue?', callback);
            unsavedModal.show();
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
