import { debounce, throttle } from 'lodash';
import CodeMirror from 'codemirror';
import localforage from 'localforage';

import config from '../config';
import { initCodeMirror } from './codemirror';
import { getNodeAtIndex, YAML_ANCHOR_REF } from './yaml-ast';
import { suppressAPIKeys } from './api-keys';
import {
  highlightOnEditorGutterClick,
  highlightOnEditorChanges,
  getAllHighlightedLines,
} from './highlight';
import { replaceHistoryState } from '../tools/url-state';
import { loadScene } from '../map/map';
import {
  clearTextMarkers,
  insertTextMarkers,
  insertTextMarkersInViewport,
} from '../editor/textmarkers';

import store from '../store';
import { MARK_FILE_DIRTY, MARK_FILE_CLEAN } from '../store/actions';

const STORAGE_LAST_EDITOR_STATE = 'last-scene';
const EDITOR_REFRESH_THROTTLE = 20;

// Export an instantiated CodeMirror instance
/* eslint-disable import/no-mutable-exports */
export let editor;
/* eslint-enable import/no-mutable-exports */

// Timeout for saving things in memory
let localMemorySaveTimer;

/**
 * Callback function passed to CodeMirror to run after it is initialized. Here,
 * We attach several event listeners that tie into Tangram Play functionality.
 *
 * @param {CodeMirror} cm - an instance of an initialized CodeMirror editor,
  *           provided by CodeMirror's `defineInitHook`.
 */
function initEditorCallback(cm) {
  /* eslint-disable no-shadow */
  // Turn on highlighting module
  cm.on('gutterClick', highlightOnEditorGutterClick);
  cm.on('changes', highlightOnEditorChanges);

  // Folding code will remove text markers, and unfolding code adds them back.
  cm.on('fold', (cm, from, to) => {
    clearTextMarkers(cm, from.line, to.line);
    // Adds text markers that might appear because new lines have "scrolled" into view
    insertTextMarkersInViewport(cm);
  });
  cm.on('unfold', (cm, from, to) => {
    insertTextMarkers(cm, cm.getDoc().yamlNodes, from.line, to.line);
  });

  /* eslint-enable no-shadow */
}

/**
 * Imported by the <Editor> React component, to be called when it mounts.
 * It is here (instead of importing `initCodeMirror()` directly) so that this
 * module can continue to export the `editor` reference to the CodeMirror
 * instance. This may change in the future if this is confusing.
 *
 * @param {HTMLElement} el - reference to the editor's container DOM node.
 */
export function initEditor(el) {
  editor = initCodeMirror(el, initEditorCallback);

  // Debug
  window.editor = editor;
}

/**
 * Utility function to refresh the editor layout - call it after the editor
 * size has changed dynamically. This function is throttled to prevent it from
 * executing too quickly.
 */
export const refreshEditor = throttle(() => {
  if (editor) {
    editor.refresh();
  }
}, EDITOR_REFRESH_THROTTLE);

// Sets or gets scene contents in the editor.
// =============================================================================

/**
 * Convenience function returning content of the editor.
 *
 * @public
 * @return {string} content
 */
export function getEditorContent() {
  return editor.getDoc().getValue();
}

/**
 * Creates a new CodeMirror document instance from a text string of file content,
 * scrubbing API keys if necessary.
 *
 * @public
 * @param {string} content - to display in editor
 * @returns {CodeMirror.Doc} doc - a CodeMirror document instance
 */
export function createCodeMirrorDoc(content) {
  // Remove any instances of Tangram Play's default API key
  const scrubbedContent = suppressAPIKeys(content, config.TILES.API_KEYS.SUPPRESSED);

  // Create a new instance of a CodeMirror document
  return new CodeMirror.Doc(scrubbedContent, 'yaml-tangram');
}

/**
 * Sets editor content with a given CodeMirror document instance.
 * This function is sometimes used to restore old editor
 * content that has not been saved (e.g. from local memory). Although it is
 * a new document instance, there are conditions from the old document that
 * must also be restored. (Note: we remember if a document in memory is "not
 * clean", but we cannot set this in CodeMirror -- it is always a clean
 * document when it is first created.)
 *
 * @public
 * @param {CodeMirror.Doc} doc - A CodeMirror document instance to set in editor
 * @param {Boolean} readOnly - whether the editor contents are read-only
 */
export function setEditorContent(doc, readOnly = false) {
  // Swap current content in CodeMirror document with the provided Doc instance.
  editor.swapDoc(doc);
  editor.setOption('readOnly', readOnly);

  // Once the document is swapped in, add text markers back in
  insertTextMarkersInViewport(editor);
}

/**
 * Clears the current editor document, by creating a new, blank CodeMirror
 * document instance and swapping it from the current editor.
 *
 * @public
 */
export function clearEditorContent() {
  const clearedDoc = createCodeMirrorDoc('');
  setEditorContent(clearedDoc, false);
}

// If editor is updated, send it to the map.
function updateContent(content) {
  const url = URL.createObjectURL(new Blob([content]));
  loadScene(url);
}

// Wrap updateContent() in a debounce function to prevent rapid series of
// changes from continuously updating the map.
const debouncedUpdateContent = debounce(updateContent, 500);

/**
 * Saves editor content and state to local memory which can be recovered in a
 * following session (or tab refresh). This function is debounced (see
 * `debouncedUpdateLocalMemory`) so editor state is autosaved fairly
 * frequently when content is being edited. This function is exported as-is
 * so other functionality can force an update at specific times. Do not use this
 * to update memory before a `window.unload` event: localforage is asynchronous,
 * which may not complete before the window is closed.
 *
 * @return {undefined}
 */
export function updateLocalMemory() {
  // Bail if embedded
  if (store.getState().app.isEmbedded === true) return;

  // Creates a clone of existing data
  const scene = Object.assign({}, store.getState().scene);

  // Updates the data for currently visible file
  const activeFile = scene.activeFileIndex;
  const doc = editor.getDoc();
  scene.files[activeFile].contents = getEditorContent();
  scene.files[activeFile].isClean = doc.isClean();
  scene.files[activeFile].scrollInfo = editor.getScrollInfo();
  scene.files[activeFile].cursor = doc.getCursor();
  scene.files[activeFile].highlightedLines = getAllHighlightedLines(doc);

  // Currently CodeMirror buffers are stashed in store. This is not a good idea
  // because they are non-serializable (have circular references) so for the
  // moment we just delete them from the object if present.
  scene.files.forEach((item) => {
    // eslint-disable-next-line no-param-reassign
    delete item.buffer;
  });

  // Store in local memory
  localforage.setItem(STORAGE_LAST_EDITOR_STATE, scene);
}

/**
 * Wrap updateLocalMemory() in a debounce function. This actually does incur
 * an extra significant processing overhead on every edit so we keep it from
 * executing all the time when called by a frequently-updating event like
 * `watchEditorForChanges()`.
 */
export const debouncedUpdateLocalMemory = debounce(updateLocalMemory, 500);

export function watchEditorForChanges(cm, changes) {
  const content = getEditorContent();
  const doc = cm.getDoc();
  const isClean = doc.isClean();
  const previousCleanState = store.getState().scene.files[0].isClean; // TODO: replace with current file

  // Update all the properties of the active file in local memory.
  // Localforage is async so it cannot be relied on to do this on the
  // window.beforeunload event; there is no guarantee the transaction is
  // completed before the page tears down. See here:
  // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Warning_About_Browser_Shutdown
  window.clearTimeout(localMemorySaveTimer);
  localMemorySaveTimer = window.setTimeout(debouncedUpdateLocalMemory, 250);

  // Send scene data to Tangram
  debouncedUpdateContent(content);

  // Update the page URL. When editor contents changes by user input
  // and the the editor state is not clean), we erase the ?scene= state
  // from the URL string. This prevents a situation where reloading (or
  // copy-pasting the URL) loads the scene file from an earlier state.
  // Only do this if clean state has changed between edits to avoid polluting
  // the action log.
  if (previousCleanState === true && isClean === false) {
    replaceHistoryState({
      scene: null,
    });

    // Also use this area to mark the state of the file in Redux store
    // TODO: These checks do not have to be debounced for Tangram.
    store.dispatch({
      type: MARK_FILE_DIRTY,
      fileIndex: 0, // TODO: replace with current file
    });
  } else if (previousCleanState === false && isClean === true) {
    store.dispatch({
      type: MARK_FILE_CLEAN,
      fileIndex: 0, // TODO: replace with current file
    });
  }
}

/**
 * Changes the value of a scalar node attached to a text marker. This relies on
 * the abstract syntax tree to make sure the correct range is replaced. (Using
 * the syntax tree allows us to account for anchor values, for example.)
 *
 * @public
 * @param {Object} marker - The marker whose value changes
 * @param {string} value - The new value to set to.
 */
export function setCodeMirrorValue(marker, value) {
  // Bail if editor is read-only
  if (editor.isReadOnly()) return;

  const origin = '+value_change';
  const doc = editor.getDoc();

  // Find the position of the text marker, and the range of the scalar node
  // it's attached to. That range is replaced with the new value.
  const pos = marker.find(); // returns { line, ch } - does this ever become
  // a { from, to } object like the documentation says? maybe if it's a text range?
  const index = doc.indexFromPos(pos);
  // Rely on the latest parsed condition
  const node = getNodeAtIndex(doc.yamlNodes, index);

  // If the node is an anchor reference, we replace the reference value instead.
  const from = (node.kind === YAML_ANCHOR_REF) ?
    doc.posFromIndex(node.value.startPosition) : doc.posFromIndex(node.startPosition);
  const to = (node.kind === YAML_ANCHOR_REF) ?
    doc.posFromIndex(node.value.endPosition) : doc.posFromIndex(node.endPosition);

  doc.replaceRange(value, from, to, origin);
}

/* This section is for the shader widget links */

/**
 * Sets a text value within a shader block
 *
 * @public
 * @param {string} value - The new value to set
 * @param {Object} start - Start { line, ch }
 * @param {Object} end - End { line, ch }
 */
export function setCodeMirrorShaderValue(value, start, end) {
  editor.replaceRange(value, start, end);
}

/**
 * Returns the left, bottom, right, top coordinates of the position we are clicking on
 *
 * @param {Object} linePos - position { line, ch } to lookup coordinates for
 */
export function getCoordinates(linePos) {
  return editor.charCoords(linePos);
}

/**
 * Set the CodeMirror cursor to a specific place within the editor
 *
 * @param {Number} line - line on which to set cursor
 * @param {Number} ch - ch on which to set cursor
 */
export function setCursor(line, ch) {
  const doc = editor.getDoc();
  doc.setCursor({ line, ch });
}
