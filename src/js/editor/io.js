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
    loadContentFromFile (content) {
        const reader = new FileReader();
        reader.onload = function (event) {
            TangramPlay.load({ contents: event.target.result });
        };
        reader.readAsText(content);
    }
};

export default EditorIO;
