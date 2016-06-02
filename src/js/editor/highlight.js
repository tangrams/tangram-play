import { editor } from './editor';
import { jumpToLine } from './codemirror/tools';
import { getQueryStringObject, serializeToQueryString } from '../tools/helpers';

const HIGHLIGHT_CLASS = 'editor-highlight';

/**
 * Highlights a line or a range of lines by applying a highlight class.
 *
 * @param {Number|CodeMirror.Pos} from - Required. The line number to start to
 *          highlighting from, or a CodeMirror.Pos object with the signature
 *          of { line, ch }.
 * @param {Number|CodeMirror.Pos} to - Optional. The line number to end
 *          highlighting on, or a CodeMirror.Pos object with the signature
 *          of { line, ch }. If undefined or null, only the "from" line is
 *          highlighted.
 * @param {Boolean} clear - Optional. Defaults to `true`, where all existing
 *          highlights are cleared first. If set to false, previous Highlights
 *          are preserved.
 */
export function highlightLines (from, to, clear = true) {
    // First, remove all existing instances of the highlight class.
    if (clear === true) {
        unhighlightAll(HIGHLIGHT_CLASS);
    }

    // Set the line to start highlighting from.
    const startLine = _getLineNumber(from);

    // The end line is the same as the start line if `to` is undefined.
    // Lines are zero-indexed, so do not use "falsy" checks -- `0` is a valid
    // value for `line`, so check if value is undefined or null specifically.
    const endLine = (typeof to !== 'undefined' && to !== null) ?
        _getLineNumber(to) : startLine;

    function _getLineNumber (arg) {
        // If `arg` is a CodeMirror position object, use its `line` property.
        // Lines are zero-indexed, so a don't use "falsy" checks for its
        // presence -- `0` is a valid value for `line`.
        // Make sure it is converted to a number object.
        if (typeof from === 'object' && from.hasOwnProperty('line') && typeof arg.line !== 'undefined') {
            return Number(arg.line);
        }
        // Otherwise, assume the value passed is a number or string, and
        // use the `arg` as provided.
        // Because lines are zero-indexed in CodeMirror, we subtract 1 from it.
        // Just in case, the return value is clamped to a minimum value of 0.
        else {
            return Math.max(Number(arg) - 1, 0);
        }
    }

    // We assume `startLine` is less than or equal to `endLine`.
    // If a range is backwards, it is ignored.
    const doc = editor.getDoc();
    for (let currentLine = startLine; currentLine <= endLine; currentLine++) {
        doc.addLineClass(currentLine, 'gutter', HIGHLIGHT_CLASS);
        doc.addLineClass(currentLine, 'background', HIGHLIGHT_CLASS);
    }

    // Update the query string
    // Lines are zero-indexed, but in the query string, use 1-indexed values.
    updateLinesQueryString(`${startLine + 1}-${endLine + 1}`);
}

/**
 * Given a node, find all the lines that are part of that entire block, and then
 * applies a highlight class to each of those lines.
 *
 * @param {Object} node - YAML-Tangram node object
 */
export function highlightBlock (node) {
    const doc = editor.getDoc();

    // Scroll the top of the block into view. Do this first so that
    // CodeMirror will parse the lines in this viewport. This is necessary
    // for the `stateAfter.yamlState.keyLevel` to be available.
    jumpToLine(editor, node.range.from.line);

    // Determine the range to highlight from.
    const blockLine = node.range.from.line;
    const blockLevel = doc.getLineHandle(blockLine).stateAfter.yamlState.keyLevel;
    let toLine = blockLine + 1;
    let thisLevel = doc.getLineHandle(toLine).stateAfter.yamlState.keyLevel;
    while (thisLevel > blockLevel) {
        toLine++;
        thisLevel = doc.getLineHandle(toLine).stateAfter.yamlState.keyLevel;
    }

    highlightLines(node.range.from, toLine);
}

/**
 * Removes highlights from all lines in the document.
 */
export function unhighlightAll () {
    const doc = editor.getDoc();

    for (let i = 0, j = doc.lineCount(); i <= j; i++) {
        doc.removeLineClass(i, 'gutter', HIGHLIGHT_CLASS);
        doc.removeLineClass(i, 'background', HIGHLIGHT_CLASS);
    }

    // Update the query string
    updateLinesQueryString(null);
}

/**
 * Updates the ?lines= query string to the given value.
 *
 * @param {string} value - the value for ?lines=. Set to null to delete it.
 */
function updateLinesQueryString (value) {
    const locationPrefix = window.location.pathname;
    const queryObj = getQueryStringObject();

    if (value) {
        queryObj.lines = value;
    }
    else {
        delete queryObj.lines;
    }

    const queryString = serializeToQueryString(queryObj);
    window.history.replaceState({}, null, locationPrefix + queryString + window.location.hash);
}
