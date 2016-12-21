import { editor } from './editor';
import { getPositionsForNode } from './yaml-ast';
import { jumpToLine } from './codemirror/tools';
import { replaceHistoryState } from '../tools/url-state';

const HIGHLIGHT_CLASS = 'editor-highlight';

let anchorLine;
let targetLine;

/**
 * Highlights a given line in the document.
 *
 * @param {CodeMirror Doc} doc - The document to add a highlight to.
 * @param {Number} line - The line number to add a highlight to.
 */
function highlightLine(doc, line) {
  if (line === null) return;
  doc.addLineClass(line, 'gutter', HIGHLIGHT_CLASS);
  doc.addLineClass(line, 'background', HIGHLIGHT_CLASS);
}

/**
 * Removes highlight a given line in the document.
 *
 * @param {CodeMirror Doc} doc - The document to remove a highlight from.
 * @param {Number} line - The line number to remove a highlight from.
 */
function unhighlightLine(doc, line) {
  if (line === null) return;
  doc.removeLineClass(line, 'gutter', HIGHLIGHT_CLASS);
  doc.removeLineClass(line, 'background', HIGHLIGHT_CLASS);
}

/**
 * Returns true if a line is highlighted. It does this by checking whether the
 * line number has the highlight class attached to it. Note that other background
 * classes may exist (e.g. for active lines).
 *
 * @param {Number} line - the line number to check.
 * @returns {Boolean}
 */
function isLineHighlighted(line) {
  const lineInfo = editor.lineInfo(line);

  // .bgClass may be null
  if (!lineInfo.bgClass) {
    return false;
  }

  return (lineInfo.bgClass.indexOf(HIGHLIGHT_CLASS) >= 0);
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
function toggleHighlightLine(doc, line) {
  if (isLineHighlighted(line)) {
    unhighlightLine(doc, line);
    return false;
  }

  highlightLine(doc, line);
  return true;
}

/**
 * Highlights a line or a range of lines by applying a highlight class.
 * Accepts arguments in any order and it will still loop in the
 * correct direction.
 *
 * @param {Number} from - Required. The line number to start
 *          highlighting from. Lines are zero-indexed.
 * @param {Number} to - Required. The line number to end
 *          highlighting on. Lines are zero-indexed.
 */
function highlightLines(from, to) {
  const doc = editor.getDoc();
  let startLine = from;
  let endLine = to;

  // Swap arguments if startLine is higher than endLine
  if (startLine > endLine) {
    [startLine, endLine] = [endLine, startLine];
  }

  for (let currentLine = startLine; currentLine <= endLine; currentLine++) {
    highlightLine(doc, currentLine);
  }
}

/**
 * Unhighlights all lines between a range of lines. Accepts
 * arguments in any order and it will still loop in the correct direction.
 *
 * @param {Number} from - Required. The line number to start
 *          unhighlighting from. Lines are zero-indexed.
 * @param {Number} to - Required. The line number to end
 *          unhighlighting on. Lines are zero-indexed.
 */
function unhighlightLines(from, to) {
  const doc = editor.getDoc();
  let startLine = from;
  let endLine = to;

  // Swap arguments if startLine is higher than endLine
  if (startLine > endLine) {
    [startLine, endLine] = [endLine, startLine];
  }

  for (let currentLine = startLine; currentLine <= endLine; currentLine++) {
    unhighlightLine(doc, currentLine);
  }
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
export function highlightRanges(lines) {
  const ranges = lines.split(',');

  for (let i = 0, j = ranges.length; i < j; i++) {
    const lineNumbers = ranges[i].split('-');

    // Lines are zero-indexed in CodeMirror, so subtract 1 from it.
    // Just in case, the return value is clamped to a minimum value of 0.
    const startLine = Math.max(Number(lineNumbers[0]) - 1, 0);
    let endLine = Math.max(Number(lineNumbers[1]) - 1, 0);

    // If a "range" is just a single number (`6` rather than `6-7`, say)
    // then `endLine` will be NaN. In this case we make `endLine` equal
    // to `startLine` so we can properly highlight the "range".
    if (Number.isNaN(endLine)) {
      endLine = startLine;
    }

    // Only jump to the first range given.
    if (i === 0) {
      jumpToLine(editor, startLine);
    }

    highlightLines(startLine, endLine);
  }
}

/**
 * Removes highlights from all lines in the document.
 */
function unhighlightAll() {
  const doc = editor.getDoc();

  for (let i = 0, j = doc.lineCount(); i <= j; i++) {
    unhighlightLine(doc, i);
  }
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
function getLineNumberRanges(array) {
  const ranges = [];
  let start;
  let end;

  for (let i = 0, j = array.length; i < j; i++) {
    start = array[i];
    end = start;
    while (array[i + 1] - array[i] === 1) {
      end = array[i + 1]; // increment the index if the numbers sequential
      i += 1;
    }
    ranges.push(start === end ? start.toString() : `${start}-${end}`);
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
function getLineNumberString(array) {
  // Line number arrays are zero-indexed, so before converting to a string,
  // we increment each number by one.
  const incrementedArray = array.map(number => number + 1);
  const ranges = getLineNumberRanges(incrementedArray);
  return ranges.join(',');
}

/**
 * Gets a string representation of all highlighted lines in the editor.
 * This looks at the editor itself, so it's guaranteed to be the current state
 * of the editor.
 *
 * @returns {String} linenumbers - in the format of '2-5,10,18-20', as
 *          returned by getLineNumberString() function
 */
export function getAllHighlightedLines() {
  const lineNumbers = [];

  for (let i = 0, j = editor.getDoc().lineCount(); i < j; i++) {
    if (isLineHighlighted(i)) {
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
export function updateLinesQueryString() {
  const allHighlightedLines = getAllHighlightedLines();
  if (allHighlightedLines !== '') {
    replaceHistoryState({ lines: allHighlightedLines });
  } else {
    replaceHistoryState({ lines: null });
  }
}

/**
 * Given a YAML-AST node, find all the lines that are part of that node, and then
 * applies a highlight class to each of those lines.
 *
 * @param {Object} node - YAML-Tangram node object
 */
export function highlightNode(node) {
  const doc = editor.getDoc();
  const range = getPositionsForNode(node, doc);

  // Scroll the top of the block into view.
  jumpToLine(editor, range.from.line);

  // First, remove all existing instances of the highlight class.
  // Then highlight the node's range and update query string.
  unhighlightAll();
  highlightLines(range.from.line, range.to.line);
  updateLinesQueryString();

  // Reset
  anchorLine = undefined;
  targetLine = undefined;
}

function onEditorGutterClick(cm, line, gutter, event) {
  // Do work when the click occurs for the left (or main) mouse button only
  if (event.button !== 0) {
    return;
  }

  // Do work only on the line number target element
  if (!event.target.classList.contains('CodeMirror-linenumber')) {
    return;
  }

  // The `line` parameter is a 0-indexed line number.

  // The meta (command or control keys) will allow highlighting of
  // non-sequential lines.
  if (event.metaKey === true) {
    const didHighlight = toggleHighlightLine(cm.getDoc(), line);
    anchorLine = didHighlight ? line : undefined;

    // Reset
    targetLine = undefined;
    // Shift keys will allow highlighting of multiple lines.
  } else if (event.shiftKey === true && anchorLine !== undefined) {
    // Clears a previous range if it exists
    if (targetLine) {
      unhighlightLines(anchorLine, targetLine);
    }

    // Then highlight the desired range
    highlightLines(anchorLine, line);

    // Remember state of how this happened
    targetLine = line;
  } else {
    // If shift key is not pressed or there is not a previously selected line
    // (which you need to do the whole range) then select one line.

    // Clear all existing highlights first
    unhighlightAll();

    // If the clicked line is the same as the one before, reset
    if (line === anchorLine) {
      anchorLine = undefined;
    } else {
      // Otherwise, highlight that one line
      highlightLine(cm.getDoc(), line);
      anchorLine = line;
    }

    // Reset
    targetLine = undefined;
  }

  // Update the query string
  updateLinesQueryString();
}

// Editor operations, such as cut, paste, delete, or inserts, can mutate
// highlighted lines. This will make sure the query string remains updated.
function onEditorChanges(cm, changes) {
  // Small performance tweak: if there's just one change on one line,
  // don't bother updating the query string, which must check the highlight
  // state on all lines
  if (changes.length === 1 && changes[0].removed.length === 1 && changes[0].text.length === 1) {
    return;
  }

  updateLinesQueryString();
}

// Add handlers for these events to the editor.
export function addHighlightEventListeners() {
  editor.on('gutterClick', onEditorGutterClick);
  editor.on('changes', onEditorChanges);
}
