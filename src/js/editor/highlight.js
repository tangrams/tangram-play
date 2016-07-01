import { editor } from './editor';
import { jumpToLine } from './codemirror/tools';
import { isEmptyString, getQueryStringObject, serializeToQueryString } from '../tools/helpers';

const HIGHLIGHT_CLASS = 'editor-highlight';

let anchorLine;
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

    // The meta (command or control keys) will allow highlighting of
    // non-sequential lines.
    if (event.metaKey === true) {
        const didHighlight = toggleHighlightLine(cm.getDoc(), line);

        if (didHighlight) {
            anchorLine = line;
        }
        else {
            anchorLine = undefined;
        }

        updateLinesQueryString();
    }
    // Shift keys will allow highlighting of multiple lines.
    else if (event.shiftKey === true && anchorLine !== undefined) {
        if (anchorLine < line) {
            highlightLines(anchorLine, line, false);
        }
        // Handle lines clicked in non-sequential order
        // If the previously highlighted line is greater than the currently
        // clicked one, then we flip the order of arguments.
        else {
            highlightLines(line, anchorLine, false);
        }

        // Remember state of how this happened
        manuallyHighlighted = true;
    }
    // If shift key is not pressed or there is not a previously selected line
    // (which you need to do the whole range) then select one line.
    else {
        // If the clicked line is the same as the one before, turn it off.
        if (line === anchorLine) {
            unhighlightAll();
            anchorLine = undefined;
        }
        else {
            highlightLines(line);
            anchorLine = line;
            manuallyHighlighted = true;
        }
    }
});

/**
 * Highlights a given line in the document.
 *
 * @param {CodeMirror Doc} doc - The document to add a highlight to.
 * @param {Number} line - The line number to add a highlight to.
 */
function highlightLine (doc, line) {
    doc.addLineClass(line, 'gutter', HIGHLIGHT_CLASS);
    doc.addLineClass(line, 'background', HIGHLIGHT_CLASS);
}

/**
 * Removes highlight a given line in the document.
 *
 * @param {CodeMirror Doc} doc - The document to remove a highlight from.
 * @param {Number} line - The line number to remove a highlight from.
 */
function unhighlightLine (doc, line) {
    doc.removeLineClass(line, 'gutter', HIGHLIGHT_CLASS);
    doc.removeLineClass(line, 'background', HIGHLIGHT_CLASS);
}

/**
 * Toggles the highlight on a given line in the document.
 *
 * @param {CodeMirror Doc} doc - The document the line is in.
 * @param {Number} line - The line number to toggle highlight on.
 * @returns {Boolean} - a boolean value corresponding to the action
 *          that was performed. Returns `true` if a line was highlighted,
 *          and `false` if a line was unhighlighted.
 */
function toggleHighlightLine (doc, line) {
    const lineInfo = editor.lineInfo(line);
    if (lineInfo.bgClass === HIGHLIGHT_CLASS) {
        unhighlightLine(doc, line);
        return false;
    }
    else {
        highlightLine(doc, line);
        return true;
    }
}

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
        highlightLine(doc, currentLine);
    }

    // Update the query string
    updateLinesQueryString();
}

/**
 * Highlights lines, given a comma delimited set of line numbers or ranges of
 * line numbers. Expects a string that would have been formed with
 * getLineNumberString(). The following are valid strings:
 *
 *      '6'
 *      '6-10'
 *      '6-10,12-30'
 *      '6-10,12-30,45,60-12'
 *
 * Note that the ranges are assumed to be in sequential order, and line numbers
 * start from 1 instead of 0. The first linenumber or range will get jumped to.
 *
 * @param {String} lines - Required. A human-readable sequence of lines and
 *          line ranges to highlight.
 */
export function highlightRanges (lines) {
    const ranges = lines.split(',');

    for (let i = 0, j = ranges.length; i < j; i++) {
        const lines = ranges[i].split('-');

        // Lines are zero-indexed in CodeMirror, so subtract 1 from it.
        // Just in case, the return value is clamped to a minimum value of 0.
        const startLine = Math.max(Number(lines[0]) - 1, 0);
        const endLine = Math.max(Number(lines[1]) - 1, 0);

        // Only jump to the first range given.
        if (i === 0) {
            jumpToLine(editor, startLine);
        }

        highlightLines(startLine, endLine, false);
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
    anchorLine = undefined;
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
        unhighlightLine(doc, i);
    }

    // Update the query string
    // Pass `false` from highlightLines() to prevent query string from flashing
    if (updateQueryString === true) {
        updateLinesQueryString();
    }
}

/**
 * Gets a string representation of all highlighted lines in the editor.
 * This looks at the editor itself, so it's guaranteed to be the current state
 * of the editor.
 *
 * @returns {String} linenumbers - in the format of '2-5,10,18-20', as
 *          returned by getLineNumberString() function
 */
export function getAllHighlightedLines () {
    const lineNumbers = [];

    for (let i = 0, j = editor.getDoc().lineCount(); i < j; i++) {
        const lineInfo = editor.lineInfo(i);
        if (lineInfo.bgClass === HIGHLIGHT_CLASS) {
            lineNumbers.push(i);
        }
    }

    const string = getLineNumberString(lineNumbers);

    return string;
}

/**
 * Updates the ?lines= query string to the currently highlighted lines in the
 * document.
 *
 */
function updateLinesQueryString () {
    const locationPrefix = window.location.pathname;
    const queryObj = getQueryStringObject();
    const allHighlightedLines = getAllHighlightedLines();

    queryObj.lines = allHighlightedLines !== '' ? allHighlightedLines : null;

    const queryString = serializeToQueryString(queryObj);
    window.history.replaceState({}, null, locationPrefix + queryString + window.location.hash);
}

/**
 * Given an array of sorted line numbers, convert it to a sequence of ranges,
 * for example:
 *
 * [2, 3, 4, 5, 10, 18, 19, 20]  =>  ['2-5', '10', '18-20']
 * [1, 2, 3, 5, 7, 9, 10, 11, 12, 14]  =>  ['1-3', '5', '7', '9-12', '14']
 * [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] => ['1-10']
 *
 */
function getLineNumberRanges (array) {
    const ranges = [];
    let start, end;

    for (let i = 0, j = array.length; i < j; i++) {
        start = array[i];
        end = start;
        while (array[i + 1] - array[i] === 1) {
            end = array[i + 1]; // increment the index if the numbers sequential
            i++;
        }
        ranges.push(start === end ? start.toString() : start + '-' + end);
    }

    return ranges;
}

/**
 * Given an array of sorted line numbers, convert it to a range and flatten
 * it to a single string. For example:
 *
 * e.g. [2, 3, 4, 5, 10, 18, 19, 20]  =>  '2-5,10,18-20'
 * This is ideal for storing in URL strings.
 *
 */
function getLineNumberString (array) {
    // Line number arrays are zero-indexed, so before converting to a string,
    // we increment each number by one.
    array = array.map(number => {
        return number + 1;
    });
    const ranges = getLineNumberRanges(array);
    return ranges.join(',');
}
