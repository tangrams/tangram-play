/**
 * Handles input/output from user's file system and various other related tasks.
 */
import noop from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { saveAs } from 'file-saver';

import ConfirmDialogModal from '../modals/ConfirmDialogModal';
import { showErrorModal } from '../modals/ErrorModal';
import { load } from '../tangram-play';
import { editor, getEditorContent } from './editor';
import store from '../store';

const NEW_SCENE_PATH = 'data/scenes/empty.yaml';

// TODO: this probably doesn't belong here.
export function checkSaveStateThen(callback = noop) {
    if (editor.doc.isClean()) {
        callback();
    } else {
        ReactDOM.render(
            <ConfirmDialogModal
                message="Your scene has not been saved. Continue?"
                confirmCallback={callback}
            />,
            document.getElementById('modal-container')
        );
    }
}

/**
 * Wrap FileReader in a Promise and returns it.
 */
function loadContentFromFile(file) {
    return new Promise((resolve, reject) => {
        // Rejects the Promise immediately if the `file` argument is not
        // a Blob object provided by a browser's file input control.
        if (!(file instanceof Blob)) {
            reject('Unable to load your file: it is not a valid file type.');
        }

        const reader = new FileReader();

        // Resolves when FileReader is completely done loading. The `load`
        // event can fire before the end of a file is encountered so we
        // listen for `loadend` instead. The Promise resolves with the value
        // of the file contents but also loads into the editor.
        reader.addEventListener('loadend', (event) => {
            load({
                filename: file.name,
                contents: event.target.result,
            });
            resolve(event.target.result);
        });

        // If FileReader encounters an error, the Promise is rejected with
        // the value of the error property on the FileReader object.
        reader.addEventListener('error', (event) => {
            reject(reader.error);
        });

        reader.readAsText(file);
    });
}

/**
 * Handles `FileList`, an object returned from a <input type="file"> element,
 * or files dropped and requested via the `DataTransfer` object. It is not
 * an array, but has properties that mimic an array. Each file in the list
 * is a `File` object and has the following properties:
 * `name` - filename
 * `lastModified` (UNIX time), `lastModifiedDate` - human readable string
 * `size` - size in bytes
 * `webkitRelativePath` - Returns the path the URL of the File is relative to.
 */
export function handleFileList(fileList) {
    if (fileList.length < 1) return;

    // Assume one file or first file is main file
    loadContentFromFile(fileList[0]).catch(error => {
        showErrorModal(error.message || error);
    });
}

/**
 * Creates an "open from filesystem" dialog box using the browser.
 *
 * JavaScript does not have access to the host system's filesystem.
 * We must go through the browser. The way this works is by constructing
 * an invisible file input element in memory, and then triggering a click
 * on it, which activates the browser's open dialog.
 */
function constructInvisibleFileInputElement() {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', 'text/x-yaml');
    fileSelector.style.display = 'none';
    fileSelector.addEventListener('change', event => {
        handleFileList(event.target.files);
    });
    return fileSelector;
}

export function openLocalFile() {
    const el = constructInvisibleFileInputElement();
    checkSaveStateThen(() => {
        el.click();
    });
}

export function newScene() {
    checkSaveStateThen(() => {
        load({ url: NEW_SCENE_PATH });
    });
}

export function exportSceneFile() {
    const typedArray = getEditorContent();
    const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });

    // Get the filename from state (or use scene.yaml fallback)
    const scene = store.getState().scene;
    const filename = scene.files[scene.rootFileIndex].filename || 'scene.yaml';

    // Use FileSaver implementation, pass `true` as third parameter
    // to prevent auto-prepending a Byte-Order Mark (BOM)
    saveAs(blob, filename, true);
    editor.doc.markClean();
}
