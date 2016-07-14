import { config } from '../config';
import { initCodeMirror } from './codemirror';
import { injectAPIKey, suppressAPIKeys } from './api-keys';
import { EventEmitter } from '../components/event-emitter';

// Export an instantiated CodeMirror instance
export const editor = initCodeMirror();

// When the divider moves, the editor width changes and might expose blank areas
// of the document that CodeMirror has not parsed and rendered. This forces the
// editor to refresh as the divider moves.
EventEmitter.subscribe('divider:drag', () => {
    editor.refresh();
});

// Debug
window.editor = editor;

// Sets or gets scene contents in the editor.
// =============================================================================

/**
 * Returns content of the editor, with injected API keys.
 *
 * @public
 * @return {string} content
 */
export function getEditorContent () {
    let content = editor.getDoc().getValue();
    //  If API keys are missing, inject one
    content = injectAPIKey(content, config.TILES.API_KEYS.DEFAULT);
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
export function setEditorContent (content, shouldMarkClean = true) {
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
export function getNodesOfLine (line) {
    const lineHandle = editor.getLineHandle(line);

    // Return the nodes. If any property in the chain is not defined,
    // return an empty array.
    try {
        return lineHandle.stateAfter.nodes || [];
    }
    catch (e) {
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
export function getNodesInRange (from, to) {
    let nodes = [];

    if (from.line === to.line) {
        // If the searched nodes are in a same line
        let line = from.line;
        let inLineNodes = getNodesOfLine(line);

        for (let node of inLineNodes) {
            if (node.range.to.ch > from.ch || node.range.from.ch < to.ch) {
                nodes.push(node);
            }
        }
    }
    else {
        // If the searched nodes are in a range of lines
        for (let i = from.line; i <= to.line; i++) {
            let inLineNodes = getNodesOfLine(i);

            for (let node of inLineNodes) {
                if (node.range.from.line === from.line) {
                    // Is in the beginning line
                    if (node.range.to.ch > from.ch) {
                        nodes.push(node);
                    }
                }
                else if (node.range.to.line === to.line) {
                    // is in the end line
                    if (node.range.from.ch < to.ch) {
                        nodes.push(node);
                    }
                }
                else {
                    // is in the sandwich lines
                    nodes.push(node);
                }
            }
        }
    }
    return nodes;
}

/**
 * Sets a node's value. If a value is prepended with a YAML anchor, the
 * anchor is left in place.
 *
 * @public
 * @param {Object} node - An object representing the node whose value changes
 * @param {string} value - The new value to set to
 * @param {string} origin - Optional. This should be a string that CodeMirror
 *          uses to understand where a change is coming from. Use CodeMirror's
 *          `+` prefix if you want changes to stack in undo history.
 */
export function setNodeValue (node, value, origin) {
    const doc = editor.getDoc();

    // Force a space between the ':' and the value
    if (node.value === '') {
        value = ' ' + value;
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
        ch: node.range.from.ch + node.key.length + 2 + node.anchor.length
    };
    const toPos = node.range.to;

    doc.replaceRange(value, fromPos, toPos, origin);
}

export function setCodeMirrorValue (bookmark, value) {
    let origin = '+value_change';
    let node = bookmark.widgetInfo;
    // console.log("NEW WORD " + value);
    // console.log("CHARS " + value.length);

    const doc = editor.getDoc();

    if(value === '') {
        value = ' ' + value;
    }

    const fromPos = {
        line: node.range.from.line,
        // Magic number: 2 refers to the colon + space between key and value
        ch: node.range.from.ch + node.key.length + 2 + node.anchor.length
    };
    const toPos = node.range.to;

    console.log("SETTING NEW VALUE " + JSON.stringify(fromPos) + " TO " + JSON.stringify(toPos));
    console.log("\n");
    console.log(bookmark);
    console.log(bookmark.lines[0].stateAfter.nodes);
    for (let test of bookmark.lines[0].stateAfter.nodes) {
        console.log("FROM: "+ JSON.stringify(test.range.from) + " TO: "+ JSON.stringify(test.range.to));
    }
    console.log(bookmark.widgetInfo);

    console.log("NEW VALUE TO SET IS: " + value);
    doc.replaceRange(value, fromPos, toPos, origin);

    for (let linenode of bookmark.lines[0].stateAfter.nodes) {
        if (node.address === linenode.address) {
            console.log("MATCHED");
            bookmark.widgetInfo = linenode;
            break;
        }
    }
    console.log("\nFINDING MARKS\n");
    console.log(doc.findMarks(fromPos, toPos));
    console.log("\n\n");

    console.log(bookmark);
    console.log(bookmark.lines[0].stateAfter.nodes);
    for (let test of bookmark.lines[0].stateAfter.nodes) {
        console.log("FROM: "+ JSON.stringify(test.range.from) + " TO: "+ JSON.stringify(test.range.to));
    }
    console.log(bookmark.widgetInfo);
    console.log("\n\n");


    return bookmark;
}
