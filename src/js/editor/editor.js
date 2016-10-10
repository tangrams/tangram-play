import { debounce } from 'lodash';
import localforage from 'localforage';

import config from '../config';
import { initCodeMirror } from './codemirror';
import { parseYamlString } from './codemirror/yaml-tangram';
import { injectAPIKey, suppressAPIKeys } from './api-keys';
import { addHighlightEventListeners, getAllHighlightedLines } from './highlight';
import { replaceHistoryState } from '../tools/url-state';
import { loadScene } from '../map/map';
import EventEmitter from '../components/event-emitter';

import store from '../store';
import { MARK_FILE_DIRTY, MARK_FILE_CLEAN } from '../store/actions';

const STORAGE_LAST_EDITOR_STATE = 'last-scene';

// Export an instantiated CodeMirror instance
// eslint-disable-next-line import/no-mutable-exports
export let editor;

// Debug
window.editor = editor;

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

    // Turn on highlighting module
    addHighlightEventListeners();
}

// Sets or gets scene contents in the editor.
// =============================================================================

/**
 * Returns content of the editor, with injected API keys.
 *
 * @public
 * @return {string} content
 */
export function getEditorContent() {
    let content = editor.getDoc().getValue();
    //  If API keys are missing, inject one
    content = injectAPIKey(content, config.MAPZEN_API_KEY);
    return content;
}

/**
 * Sets content of the editor, scrubbing API keys. This is meant to replace
 * the contents of the entire editor, so history is also cleared. Normally,
 * this means also marking contents of the editor as clean, but since it's
 * possible to restore old editor content that has not been saved (from local)
 * memory, the `shouldMarkClean` argument allows content to be replaced but
 * not be marked as clean.
 *
 * @public
 * @param {string} content - to display in editor
 * @param {Boolean} shouldMarkClean - if true, mark contents of editor
 *          as clean. If false, do not mark as clean. Defaults to true.
 */
export function setEditorContent(content, shouldMarkClean = true) {
    const doc = editor.getDoc();

    // Remove any instances of Tangram Play's default API key
    content = suppressAPIKeys(content, config.TILES.API_KEYS.SUPPRESSED);

    // Set content in CodeMirror document.
    doc.setValue(content);
    doc.clearHistory();
    if (shouldMarkClean === true) {
        doc.markClean();
    }
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

    const scene = store.getState().scene;
    const activeFile = scene.activeFileIndex;

    scene.files[activeFile].contents = content;
    scene.files[activeFile].isClean = isClean;
    scene.files[activeFile].scrollInfo = editor.getScrollInfo();
    scene.files[activeFile].cursor = doc.getCursor();
    scene.files[activeFile].highlightedLines = getAllHighlightedLines();

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

    // Update all the properties of the active file in local memory.
    // Localforage is async so it cannot be relied on to do this on the
    // window.beforeunload event; there is no guarantee the transaction is
    // completed before the page tears down. See here:
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Warning_About_Browser_Shutdown
    debouncedUpdateLocalMemory(content, doc, isClean);

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
            // We might want to have two different parsers, a simpler one without keys and just address for
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
    let foundInlineNodes = null; // If an inline node is changed, we need to reparse all the other nodes in that line.

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
