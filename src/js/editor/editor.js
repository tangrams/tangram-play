import { debounce, throttle } from 'lodash';
import CodeMirror from 'codemirror';
import localforage from 'localforage';

import config from '../config';
import { initCodeMirror } from './codemirror';
import { parseYamlString } from './codemirror/yaml-tangram';
import { ParsedYAMLDocument } from './yaml-ast';
import { suppressAPIKeys } from './api-keys';
import { addHighlightEventListeners, getAllHighlightedLines } from './highlight';
import { replaceHistoryState } from '../tools/url-state';
import { loadScene } from '../map/map';
import { insertMarksInViewport } from '../editor/bookmarks';
import EventEmitter from '../components/event-emitter';

import store from '../store';
import { MARK_FILE_DIRTY, MARK_FILE_CLEAN } from '../store/actions';

const STORAGE_LAST_EDITOR_STATE = 'last-scene';
const EDITOR_REFRESH_THROTTLE = 20;

// Export an instantiated CodeMirror instance
/* eslint-disable import/no-mutable-exports */
export let editor;
export let parsedYAMLDocument;
/* eslint-enable import/no-mutable-exports */

// Timeout for saving things in memory
let localMemorySaveTimer;

/**
 * Imported by the <Editor> React component, to be called when it mounts.
 * It is here (instead of importing `initCodeMirror()` directly) so that this
 * module can continue to export the `editor` reference to the CodeMirror
 * instance. This may change in the future if this is confusing.
 *
 * @param {Node} el - reference to the editor's container DOM node.
 */
export function initEditor(el) {
  editor = initCodeMirror(el);

  // Debug
  window.editor = editor;

  // Turn on highlighting module
  addHighlightEventListeners();
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

  // Parse the document
  const content = doc.getValue();
  parsedYAMLDocument = new ParsedYAMLDocument(content);

  // Debug access
  window.parsedYAMLDocument = parsedYAMLDocument;

  // Once the document is swapped in, if the content is not read-only,
  // add bookmarks back in if they're not added already.
  if (readOnly === false) {
    insertMarksInViewport();
  }
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

function updateLocalMemory(content, doc, isClean) {
  // Bail if embedded
  if (window.isEmbedded) {
    return;
  }

  // Creates a clone of existing data
  const scene = Object.assign({}, store.getState().scene);
  const activeFile = scene.activeFileIndex;

  scene.files[activeFile].contents = content;
  scene.files[activeFile].isClean = isClean;
  scene.files[activeFile].scrollInfo = editor.getScrollInfo();
  scene.files[activeFile].cursor = doc.getCursor();
  scene.files[activeFile].highlightedLines = getAllHighlightedLines();

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

// Wrap updateLocalMemory() in a debounce function. This actually does incur
// an extra significant processing overhead on every edit so we keep it from
// executing all the time.
const debouncedUpdateLocalMemory = debounce(updateLocalMemory, 500);

export function watchEditorForChanges() {
  const content = getEditorContent();
  const doc = editor.getDoc();
  const isClean = doc.isClean();

  parsedYAMLDocument.regenerate(content);

  // Update all the properties of the active file in local memory.
  // Localforage is async so it cannot be relied on to do this on the
  // window.beforeunload event; there is no guarantee the transaction is
  // completed before the page tears down. See here:
  // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Warning_About_Browser_Shutdown
  window.clearTimeout(localMemorySaveTimer);
  localMemorySaveTimer = window.setTimeout(debouncedUpdateLocalMemory,
    250, content, doc, isClean);

  // Send scene data to Tangram
  debouncedUpdateContent(content);

  // Update the page URL. When editor contents changes by user input
  // and the the editor state is not clean), we erase the ?scene= state
  // from the URL string. This prevents a situation where reloading (or
  // copy-pasting the URL) loads the scene file from an earlier state.
  if (isClean === false) {
    replaceHistoryState({
      scene: null,
    });

    // Also use this area to mark the state of the file in Redux store
    // TODO: These checks do not have to be debounced for Tangram.
    store.dispatch({
      type: MARK_FILE_DIRTY,
      fileIndex: 0,
    });
  } else {
    store.dispatch({
      type: MARK_FILE_CLEAN,
      fileIndex: 0,
    });
  }
}

// Getting parsed nodes.
// =============================================================================

/**
 * Returns an array of nodes recorded in a parsed line's state.
 * If there are no nodes for any reason, return an empty array.
 *
 * @public
 * @param {Number} line - the number of the line to check, 0-index.
 * @return {Array} nodes
 */
export function getNodesOfLine(line) {
  const lineHandle = editor.getLineHandle(line);

  // Return the nodes. If any property in the chain is not defined,
  // return an empty array.
  try {
    return lineHandle.stateAfter.nodes || [];
  } catch (e) {
    return [];
  }
}

/**
 * Returns an array of nodes in a given range. Calls getNodesOfLine()
 * repeatedly for each line in the range.
 *
 * @public
 * @param {Number} line - the number of the line to check, 0-index.
 * @return {Array} nodes
 */
export function getNodesInRange(from, to) {
  const nodes = [];

  if (from.line === to.line) {
    // If the searched nodes are in a same line
    const line = from.line;
    const inLineNodes = getNodesOfLine(line);

    for (const node of inLineNodes) {
      if (node.range.to.ch > from.ch || node.range.from.ch < to.ch) {
        nodes.push(node);
      }
    }
  } else {
    // If the searched nodes are in a range of lines
    for (let i = from.line; i <= to.line; i++) {
      const inLineNodes = getNodesOfLine(i);

      for (const node of inLineNodes) {
        if (node.range.from.line === from.line) {
          // Is in the beginning line
          if (node.range.to.ch > from.ch) {
            nodes.push(node);
          }
        } else if (node.range.to.line === to.line) {
          // is in the end line
          if (node.range.from.ch < to.ch) {
            nodes.push(node);
          }
        } else {
          // is in the sandwich lines
          nodes.push(node);
        }
      }
    }
  }
  return nodes;
}

/**
 * Gets an array of nodes for a given address (formatted `like:this`).
 *
 * @public
 * @param {string} address
 * @returns {Array} nodes
 */
export function getNodesForAddress(address) {
  // NOTE:
  // This is an expensive process because it needs to iterate through every
  // line until it finds the right address. Could be optimized if we store
  // addresses in a map... but then the question is how we keep it synced
  let lastState;
  for (let line = 0, size = editor.getDoc().size; line < size; line++) {
    const lineHandle = editor.getLineHandle(line);

    if (!lineHandle.stateAfter) {
      // If the line is NOT parsed.
      // ======================================================
      //
      // NOTE:
      // Manually parse it in a temporary buffer to avoid conflicts
      // with CodeMirror parser.
      // This means outside the Line Handle
      //
      // Copy the last parsed state
      let state = JSON.parse(JSON.stringify(lastState));
      state.line = line;

      // Parse the current state
      state = parseYamlString(lineHandle.text, state, 4);

      // Iterate through keys in this line
      for (const key of state.nodes) {
        if (key.address === address) {
          return key;
        }
      }
      // if nothing was found. Record the state and try again
      lastState = state;
      // TODO:
      // We might want to have two different parsers, a simpler one without
      // keys and just address for
      // the higliting and another more roboust that keep tracks of:
      // pairs (key/values), their ranges (from-to positions),
      // address and a some functions like getValue, setValue which could
      // be use by widgets or others addons to modify content
    } else {
      // it the line HAVE BEEN parsed (use the stateAfter)
      // ======================================================
      lastState = lineHandle.stateAfter;
      const keys = getNodesOfLine(line);
      for (const key of keys) {
        if (key.address === address) {
          return key;
        }
      }
    }
  }

  console.log('Fail searching', address);
  return null;
}

// If an inline node was changed, we'd like to reparse all the widgets in the line
// This function sends an event to our widgets-manager.js
function clearInlineNodes(fromPos) {
  EventEmitter.dispatch('editor:inlinenodes', { from: fromPos });
}

/**
 * Sets a bookmark's value. If a value is prepended with a YAML anchor, the
 * anchor is left in place.
 *
 * @public
 * @param {Object} bookmark - An object representing the bookmark whose value changes
 * @param {string} value - The new value to set to
 */
export function setCodeMirrorValue(bookmark, value) {
  // If editor is readonly, pass through bookmark unchanged.
  if (editor.isReadOnly()) {
    return bookmark;
  }

  // If an inline node is changed, we need to reparse all the other nodes in that line.
  let foundInlineNodes = null;

  const origin = '+value_change';

  // We should refresh the editor before the replacement
  // Believe this catches cases where we are parsing multiple colors that are in the viewport
  // TODO: probably not necessary if not using colorpalette probably
  editor.getStateAfter(bookmark.widgetPos.from.line, true);
  editor.getStateAfter(bookmark.widgetPos.to.line, true);

  const nodeArray = bookmark.lines[0].stateAfter.nodes;
  let node;

  // If only one node per line, always just fetch the node in Code Mirror's state after
  // This will reduce all sorts of errors because most cases are one-widget lines.
  if (nodeArray.length === 1) {
    node = nodeArray[0];
  } else {
    // If inline nodes
    for (const singleNode of nodeArray) {
      if (singleNode.range.from.ch === bookmark.widgetPos.from.ch) {
        node = singleNode;
        foundInlineNodes = node.range.from; // We found an inline node, log where it's at
        break;
      }
    }
  }

  const doc = editor.getDoc();

  // Force a space between the ':' and the value
  if (value === '') {
    value = ` ${value}`;
  }

  // Calculate beginning character of the value
  //               key:_[anchor]value
  //               ^ ^^^^
  //               | ||||__ + anchor.length
  //               | |||___ + 1
  //               | | `--- + 1
  //  range.from.ch  key.length
  const fromPos = {
    line: node.range.from.line,
    // Magic number: 2 refers to the colon + space between key and value
    ch: node.range.from.ch + node.key.length + 2 + node.anchor.length,
  };
  const toPos = node.range.to;

  doc.replaceRange(value, fromPos, toPos, origin);

  // If an inline node was changed, we'd like to reparse all the widgets in the line
  if (foundInlineNodes !== null) {
    setTimeout(clearInlineNodes(foundInlineNodes), 0);
  }

  return bookmark;
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
