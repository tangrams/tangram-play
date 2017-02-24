/**
 * Handles input/output from user's file system and various other related tasks.
 */
import noop from 'lodash';
import { saveAs } from 'file-saver';

import { showConfirmDialogModal } from '../modals/ConfirmDialogModal';
import { showErrorModal } from '../modals/ErrorModal';
import { load } from '../tangram-play';
import { addError } from './errors';
import { editor, getEditorContent } from './editor';
import store from '../store';
import { MARK_FILE_CLEAN, SAVE_SCENE } from '../store/actions';

const NEW_SCENE_PATH = 'data/scenes/blank.yaml';

// TODO: this probably doesn't belong here.
export function checkSaveStateThen(callback = noop) {
  if (editor.doc.isClean()) {
    callback();
  } else {
    showConfirmDialogModal('Your scene has not been saved. Continue?', callback);
  }
}

/**
 * Checks the whether a particular file in the scene file list needs to be
 * saved before executing `callback`. The file may have the `isClean` property
 * set to false if it has been edited. As a shortcut, files with `readOnly`
 * property set to true is assumed to not have been edited.
 *
 * @param {number} doc - index of file in store
 * @param {function} callback - callback function to run if document is clean
 *          or confirmation is given
 * @todo - this probably doesn't belong here.
 */
export function checkSaveStateOfDocumentThen(index, callback = noop) {
  const file = store.getState().scene.files[index];
  if (file.readOnly === true || file.isClean === true) {
    callback();
  } else {
    showConfirmDialogModal('Your scene has not been saved. Continue?', callback);
  }
}

/**
 * Wraps FileReader.readAsText() in a Promise
 *
 * @param {Blob|File} blob - the Blob or File from which to read. This argument
 *          is passed as the first argument to FileReader.readAsText().
 * @return {Promise} - resolved with content of Blob or File, or a Promise
 *          rejection with error message.
 */
export function readBlobAsText(blob) {
  return new Promise((resolve, reject) => {
    // Rejects the Promise immediately if the `file` argument is not
    // a Blob or File object
    if (!(blob instanceof Blob || blob instanceof File)) {
      reject('Unable to load your file: it is not a valid file type.');
      return;
    }

    if (blob.type && blob.type.startsWith('application/zip')) {
      reject('Tangram Play does not support zipped scene bundles right now.');
      return;
    }

    const reader = new FileReader();

    // Resolves when FileReader is completely done loading. The `load` event
    // can fire before the end of a file is encountered so we listen for
    // loadend` instead. The Promise resolves with the value of the file
    // contents but also loads into the editor.
    reader.addEventListener('loadend', (event) => {
      resolve(event.target.result);
    });

    // If FileReader encounters an error, the Promise is rejected with
    // the value of the error property on the FileReader object.
    reader.addEventListener('error', (event) => {
      reject(reader.error);
    });

    reader.readAsText(blob);
  });
}

/**
 * Wrap FileReader in a Promise and returns it.
 */
export function loadContentFromFile(file) {
  return readBlobAsText(file)
    .then((contents) => {
      load({
        filename: file.name,
        contents,
      });
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
  loadContentFromFile(fileList[0]).catch((error) => {
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
  fileSelector.addEventListener('change', (event) => {
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

export function getRootFileName() {
  // Get the filename from state (or use scene.yaml fallback)
  const scene = store.getState().scene;
  return scene.files[scene.rootFileIndex].filename || 'scene.yaml';
}

function showApiKeyWarningIfNecessary() {
  if (store.getState().app.mapzenAPIKeyInjected === true) {
    addError({
      type: 'warning', // {string} 'error' or 'warning'
      message: 'This scene uses at least one Mapzen vector tile service without a Mapzen API key. Keyless requests will be disabled after March 1, 2017. Please add an API key as soon as possible.',
      link: 'https://mapzen.com/blog/api-keys-required/',
    });
  }
}

export function markSceneSaved(saveDispatch) {
  editor.doc.markClean();

  // Marked "saved" state in UI
  store.dispatch({
    type: MARK_FILE_CLEAN,
    fileIndex: 0, // TODO: replace with current file
  });

  store.dispatch(saveDispatch);
  showApiKeyWarningIfNecessary();
}

export function exportSceneFile() {
  const typedArray = getEditorContent();
  const blob = new Blob([typedArray], { type: 'text/plain;charset=utf-8' });
  const filename = getRootFileName();

  // Use FileSaver implementation, pass `true` as third parameter
  // to prevent auto-prepending a Byte-Order Mark (BOM)
  saveAs(blob, filename, true);

  markSceneSaved({
    type: SAVE_SCENE,
    location: 'FILE',
    timestamp: new Date().toISOString(),
  });
}
