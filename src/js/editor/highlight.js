import { editor } from './editor';

const HIGHLIGHT_CLASS = 'editor-highlight';

/**
 * Highlights a line or a range of lines by applying a class to that line.
 *
 * @param {Number|CodeMirror.Pos} from - Required. The line number to start to
 *          highlighting from, or a CodeMirror.Pos object with the signature
 *          of { line, ch }.
 * @param {Number|CodeMirror.Pos} to - Optional. The line number to end
 *          highlighting on, or a CodeMirror.Pos object with the signature
 *          of { line, ch }. If undefined or null, only the "from" line is
 *          highlighted.
 * @param {string} className - Optional. The class name to apply to each line.
 *          If not provided, a default class name is used.
 */
export function highlightLines (from, to, className = HIGHLIGHT_CLASS) {
    // First, remove all existing instances of this classname.
    unhighlightAll(className);

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
        doc.addLineClass(currentLine, 'gutter', className);
        doc.addLineClass(currentLine, 'background', className);
    }
}

/**
 * Given a node, find all the lines that are part of that entire block, and then
 * apply a class name to each of those lines. The class might have the effect of
 * 'highlighting' that section.
 *
 * @param {Object} node - YAML-Tangram node object
 * @param {string} className - the class name to apply to each line in the
 *          block.  If not provided, a default class name is used.
 */
export function highlightBlock (node, className = HIGHLIGHT_CLASS) {
    const doc = editor.getDoc();

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
 *
 * @param {string} className - Optional. The class name to remove from the each
 *          line in the document. If not provided, a default class name is used.
 */
export function unhighlightAll (className = HIGHLIGHT_CLASS) {
    const doc = editor.getDoc();

    for (let i = 0, j = doc.lineCount(); i <= j; i++) {
        doc.removeLineClass(i, 'gutter', className);
        doc.removeLineClass(i, 'background', className);
    }
}
