import { editor } from './editor'; // TODO: deprecate import from highlightNode()
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
 * @param {CodeMirror Doc} doc - The document the line is in.
 * @param {Number} line - the line number to check.
 * @returns {Boolean}
 */
function isLineHighlighted(doc, line) {
  const lineInfo = doc.lineInfo(line);

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
  if (isLineHighlighted(doc, line)) {
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
 * @param {CodeMirror Doc} doc - The document the lines are in
 * @param {Number} from - Required. The line number to start
 *          highlighting from. Lines are zero-indexed.
 * @param {Number} to - Required. The line number to end
 *          highlighting on. Lines are zero-indexed.
 */
function highlightLines(doc, from, to) {
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
 * @param {CodeMirror Doc} doc - The document the lines are in
 * @param {Number} from - Required. The line number to start
 *          unhighlighting from. Lines are zero-indexed.
 * @param {Number} to - Required. The line number to end
 *          unhighlighting on. Lines are zero-indexed.
 */
function unhighlightLines(doc, from, to) {
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
 * Highlights lines, given a range of line numbers in a string format like
 * "a-b". A single line number would also work.
 *
 * @param {CodeMirror Doc} doc - Required. The document the lines are in
 * @param {String} ranges - Required. A human-readable range of lines to highlight.
 */
function highlightRange(doc, range) {
  const lineNumbers = range.split('-');

  // Lines are zero-indexed in CodeMirror, so subtract 1 from it.
  // Just in case, the return value is clamped to a minimum value of 0.
  const startLine = Math.max(Number(lineNumbers[0]) - 1, 0);
  const endLine = Math.max(Number(lineNumbers[1]) - 1, 0);

  // If a "range" is just a single number (`6` rather than `6-7`, say)
  // then `endLine` will be NaN. In this case just highlight the one line.
  if (Number.isNaN(endLine)) {
    highlightLine(doc, startLine);
  } else {
    highlightLines(doc, startLine, endLine);
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
 *      '6-10,12-30,45,60-72'
 *
 * Note that the ranges are assumed to be in sequential order, and line numbers
 * start from 1 instead of 0. The first linenumber or range will get jumped to.
 *
 * @param {CodeMirror Doc} doc - The document the lines are in
 * @param {String} ranges - Required. A human-readable sequence of lines and
 *          line ranges to highlight.
 */
export function highlightRanges(doc, lines) {
  const ranges = lines.split(',');

  for (let i = 0, j = ranges.length; i < j; i++) {
    highlightRange(doc, ranges[i]);

    // Jump to the first highlighted line in the given range of lines.
    // Check that doc instance is associated with a CodeMirror editor.
    if (i === 0) {
      const cm = doc.getEditor();
      const line = window.parseInt(ranges[i], 10);
      if (cm && !Number.isNaN(line)) jumpToLine(cm, line);
    }
  }
}

/**
 * Removes highlights from all lines in the document.
 *
 * @param {CodeMirror Doc} doc - The document the lines are in
 */
function unhighlightAll(doc) {
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
 * @param {Array} - the array to convert
 * @returns {Array} - consolidated array
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
 * @param {Array} - the array to convert
 * @returns {string} - a list of ranges in string form
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
 * @param {CodeMirror Doc} doc - The document the lines are in
 * @returns {String} linenumbers - in the format of '2-5,10,18-20', as
 *          returned by getLineNumberString() function
 */
export function getAllHighlightedLines(doc) {
  const lineNumbers = [];

  for (let i = 0, j = doc.lineCount(); i < j; i++) {
    if (isLineHighlighted(doc, i)) {
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
 * @param {CodeMirror Doc} doc - The document the lines are in
 */
function updateLinesQueryString(doc) {
  const allHighlightedLines = getAllHighlightedLines(doc);
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
  unhighlightAll(doc);
  highlightLines(doc, range.from.line, range.to.line);
  updateLinesQueryString(doc);

  // Reset
  anchorLine = undefined;
  targetLine = undefined;
}

/**
 *
 * @param {CodeMirror} cm - the CodeMirror instance
 * @param {Number} line - a 0-indexed line number
 * @param {} gutter - not used
 * @param {Event} event - the click event
 */
export function highlightOnEditorGutterClick(cm, line, gutter, event) {
  // Bail early if the click is not the left (or main) mouse button only
  if (event.button !== 0) return;

  // Bail early if click does not occur on the line number target element
  if (!event.target.classList.contains('CodeMirror-linenumber')) return;

  const doc = cm.getDoc();

  // The meta (command or control keys) will allow highlighting of
  // non-sequential lines.
  if (event.metaKey === true) {
    const didHighlight = toggleHighlightLine(doc, line);
    anchorLine = didHighlight ? line : undefined;

    // Reset
    targetLine = undefined;

  // Shift keys will allow highlighting of multiple lines.
  } else if (event.shiftKey === true && anchorLine !== undefined) {
    // Clears a previous range if it exists
    if (targetLine) {
      unhighlightLines(doc, anchorLine, targetLine);
    }

    // Then highlight the desired range
    highlightLines(doc, anchorLine, line);

    // Remember state of how this happened
    targetLine = line;

  // If shift key is not pressed or there is not a previously selected line
  // (which you need to do the whole range) then select one line.
  } else {
    // Clear all existing highlights first
    unhighlightAll(doc);

    // If the clicked line is the same as the one before, reset
    if (line === anchorLine) {
      anchorLine = undefined;
    } else {
      // Otherwise, highlight that one line
      highlightLine(doc, line);
      anchorLine = line;
    }

    // Reset
    targetLine = undefined;
  }

  // Update the query string
  updateLinesQueryString(doc);
}

// Editor operations, such as cut, paste, delete, or inserts, can mutate
// highlighted lines. This will make sure the query string remains updated.
export function highlightOnEditorChanges(cm, changes) {
  // Small performance tweak: if there's just one change on one line,
  // don't bother updating the query string, which must check the highlight
  // state on all lines
  if (changes.length === 1 && changes[0].removed.length === 1 && changes[0].text.length === 1) {
    return;
  }

  updateLinesQueryString(cm.getDoc());
}
