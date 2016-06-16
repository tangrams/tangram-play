import { editor } from './editor';
import { jumpToLine } from './codemirror/tools';
import { isEmptyString, getQueryStringObject, serializeToQueryString } from '../tools/helpers';

const HIGHLIGHT_CLASS = 'editor-highlight';

let prevHighlightedLine;
let manuallyHighlighted = false;

editor.on('gutterClick', function (cm, line, gutter, event) {
    // Do work when the click occurs for the left (or main) mouse button only
    if (event.button !== 0) {
        return;
    }

    // Do work only on the line number target element
    if (!event.target.classList.contains('CodeMirror-linenumber')) {
        return;
    }

    // Shift keys will allow highlighting of multiple lines.
    if (event.shiftKey === true && prevHighlightedLine !== undefined) {
        if (prevHighlightedLine < line) {
            highlightLines(prevHighlightedLine, line);
        }
        // Handle lines clicked in non-sequential order
        // If the previously highlighted line is greater than the currently
        // clicked one, then we flip the order of arguments.
        else {
            highlightLines(line, prevHighlightedLine);
        }

        // Remember state of how this happened
        manuallyHighlighted = true;
    }
    // If shift key is not pressed or there is not a previously selected line
    // (which you need to do the whole range) then select one line.
    else {
        // If the clicked line is the same as the one before, turn it off.
        if (line === prevHighlightedLine) {
            unhighlightAll();
            prevHighlightedLine = undefined;
        }
        else {
            highlightLines(line);
            prevHighlightedLine = line;
            manuallyHighlighted = true;
        }
    }
});

/**
 * Highlights a line or a range of lines by applying a highlight class.
 *
 * @param {Number|CodeMirror.Pos} from - Required. The line number to start to
 *          highlighting from, or a CodeMirror.Pos object with the signature
 *          of { line, ch }. Lines are zero-indexed.
 * @param {Number|CodeMirror.Pos} to - Optional. The line number to end
 *          highlighting on, or a CodeMirror.Pos object with the signature
 *          of { line, ch }. If undefined or null, only the "from" line is
 *          highlighted. Lines are zero-indexed.
 * @param {Boolean} clear - Optional. Defaults to `true`, where all existing
 *          highlights are cleared first. If set to false, previous Highlights
 *          are preserved.
 */
export function highlightLines (from, to, clear = true) {
    // First, remove all existing instances of the highlight class.
    if (clear === true) {
        // Pass `false` as the second parameter to prevent query string
        // from flashing
        unhighlightAll({ updateQueryString: false });
    }

    // Set the line to start highlighting from.
    const startLine = _getLineNumber(from);

    // The end line is the same as the start line if `to` is undefined.
    // Lines are zero-indexed, so do not use "falsy" checks -- `0` is a valid
    // value for `line`, so check if value is undefined, null or isNaN
    // specifically.
    const endLine = (to !== undefined && to !== null && !Number.isNaN(to))
        ? _getLineNumber(to) : startLine;

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
        else {
            return Number(arg);
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
    if (startLine === endLine) {
        updateLinesQueryString(`${startLine + 1}`);
    }
    else {
        updateLinesQueryString(`${startLine + 1}-${endLine + 1}`);
    }
}

/**
 * Given a node, find all the lines that are part of that entire block, and then
 * applies a highlight class to each of those lines.
 * TODO: This can still be pretty buggy because `stateAfter` is still not
 * guaranteed.
 *
 * @param {Object} node - YAML-Tangram node object
 */
export function highlightBlock (node) {
    const doc = editor.getDoc();

    // Scroll the top of the block into view. Do this first so that
    // CodeMirror will parse the lines in this viewport. This is necessary
    // for the `stateAfter.keyLevel` to be available.
    jumpToLine(editor, node.range.from.line);

    // Determine the range to highlight from.
    const blockLine = node.range.from.line;
    // This can still sometimes fail, for unknown reasons.
    const blockLevel = doc.getLineHandle(blockLine).stateAfter.keyLevel;
    let toLine = blockLine;
    let thisLevel = blockLevel;
    do {
        const nextLineHandle = doc.getLineHandle(toLine + 1);
        if (nextLineHandle !== undefined && !isEmptyString(nextLineHandle.text)) {
            // The nextLineHandle might not have a stateAfter, so wrap in try {}
            try {
                thisLevel = nextLineHandle.stateAfter.keyLevel;
            }
            catch (err) {
                break;
            }

            if (thisLevel > blockLevel) {
                toLine++;
            }
        }
        // Break if no next line. Required to prevent infinite loops.
        else {
            break;
        }
    } while (thisLevel > blockLevel);

    highlightLines(node.range.from, toLine);

    // Reset
    prevHighlightedLine = undefined;
    manuallyHighlighted = false;
}

/**
 * Removes highlights from all lines in the document.
 *
 * @param {Boolean} defer - Optional. Default is false. If `true`, then this
 *          function does not unhighlight any lines if the current highlighting
 *          was created by a user clicking on the gutters.
 * @param {Boolean} updateQueryString - Optional. Default is true. If `false`,
 *          then the query string is not blanked after unhighlighting lines.
 */
export function unhighlightAll ({ defer = false, updateQueryString = true } = {}) {
    if (defer === true && manuallyHighlighted === true) {
        return;
    }

    const doc = editor.getDoc();

    for (let i = 0, j = doc.lineCount(); i <= j; i++) {
        doc.removeLineClass(i, 'gutter', HIGHLIGHT_CLASS);
        doc.removeLineClass(i, 'background', HIGHLIGHT_CLASS);
    }

    // Update the query string
    // Pass `false` from highlightLines() to prevent query string from flashing
    if (updateQueryString === true) {
        updateLinesQueryString(null);
    }
}

/**
 * Updates the ?lines= query string to the given value.
 *
 * @param {string} value - the value for ?lines=. Set to null to delete it.
 */
function updateLinesQueryString (value) {
    const locationPrefix = window.location.pathname;
    const queryObj = getQueryStringObject();

    queryObj.lines = value;

    const queryString = serializeToQueryString(queryObj);
    window.history.replaceState({}, null, locationPrefix + queryString + window.location.hash);
}
