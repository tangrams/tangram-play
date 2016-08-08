import noop from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import ConfirmDialogModal from '../modals/ConfirmDialogModal';
import TangramPlay from '../tangram-play';
import { editor, getEditorContent } from './editor';
import { saveAs } from '../vendor/FileSaver.min.js';

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
    checkSaveStateThen (callback = noop) {
        if (editor.doc.isClean()) {
            callback();
        }
        else {
            ReactDOM.render(
                <ConfirmDialogModal
                    message='Your scene has not been saved. Continue?'
                    confirmCallback={callback}
                />,
                document.getElementById('modal-container')
            );
        }
    },
    /**
     * Wrap FileReader in a Promise and returns it.
     */
    loadContentFromFile (content) {
        return new Promise(function (resolve, reject) {
            // Rejects the Promise immediately if the `content` argument is not
            // a Blob object provided by a browser's file input control.
            if (!content instanceof Blob) {
                reject('Unable to load your file: it is not a valid file type.');
            }

            const reader = new FileReader();

            // Resolves when FileReader is completely done loading. The `load`
            // event can fire before the end of a file is encountered so we
            // listen for `loadend` instead. The Promise resolves with the value
            // of the file contents but also loads into the editor.
            reader.addEventListener('loadend', (event) => {
                TangramPlay.load({ contents: event.target.result });
                resolve(event.target.result);
            });

            // If FileReader encounters an error, the Promise is rejected with
            // the value of the error property on the FileReader object.
            reader.addEventListener('error', (event) => {
                reject(reader.error);
            });

            reader.readAsText(content);
        });
    }
};

export default EditorIO;
