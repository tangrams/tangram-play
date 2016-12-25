//  GET Functions
//  ===============================================================================
import { isEmptyString, countLeadingSpaces } from '../../tools/helpers';
import { parsedYAMLDocument } from '../../editor/editor';
import { getNodeLevel } from '../../editor/yaml-ast';

//  Get the indentation level of a line
// @deprecated
export function getLineInd(cm, line) {
  return countLeadingSpaces(cm.lineInfo(line).text) / cm.getOption('tabSize');
}

//  Check if a line is empty
export function isEmpty(cm, nLine) {
  return isEmptyString(cm.lineInfo(nLine).text);
}

//  Check if the line is commented YAML style
export function isStrCommented(str) {
  const regex = /^\s*[#||//]/gm;
  return (regex.exec(str) || []).length > 0;
}
export function isCommented(cm, nLine) {
  return isStrCommented(cm.lineInfo(nLine).text);
}

// Escape regex special characters
// via http://stackoverflow.com/a/9310752
export function regexEscape(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

//  Common NAVIGATION functions on CM
//  ===============================================================================

/**
 * Scrolls a given line into view.
 *
 * CodeMirror's native `scrollIntoView()` method only scrolls just enough to
 * bring a line into view, which can put the line at the bottom of the viewport.
 * This forces the line to be placed as high as possible in the viewport.
 *
 * @params {CodeMirror} cm - instance of CodeMirror.
 * @params {Number} line - the line number to scroll to.
 */
export function jumpToLine(cm, line) {
  cm.scrollTo(null, cm.charCoords({ line, ch: 0 }, 'local').top);
}

// Helper functions for code folding in CodeMirror
// Depends on the `fold/foldcode.js' addon being present
// =============================================================================

/**
 * Unfolds all lines.
 *
 * @param {CodeMirror} cm - the CodeMirror instance.
 */
export function unfoldAll(cm) {
  const rangeFinder = cm.getOption('foldGutter').rangeFinder;
  for (let i = 0, j = cm.lineCount(); i < j; i++) {
    cm.foldCode({ line: i }, rangeFinder, 'unfold');
  }
}

/**
 * Folds all lines above a specific indentation level. At level 1, all top-level
 * YAML blocks are folded. At level 2, all second-level YAML blocks are folded,
 * and so on.
 *
 * @param {CodeMirror} cm - the CodeMirror instance.
 * @param {number} level - the indentation level, after which blocks will be
 *          folded.
 */
export function foldByLevel(cm, level) {
  unfoldAll(cm);
  const rangeFinder = cm.getOption('foldGutter').rangeFinder;
  const doc = cm.getDoc();

  let line = cm.lineCount() - 1;
  while (line >= 0) {
    // For each line, get the first character after whitespace, determine
    // its level, and if it is above the requested level, fold it.
    const text = doc.getLine(line);
    const spaces = countLeadingSpaces(text);
    const pos = { line, ch: spaces };
    const index = doc.indexFromPos(pos);

    // Depends on the parsed YAML interface - is this too side-effecty?
    const node = parsedYAMLDocument.getNodeAtIndex(index);
    const compareLevel = getNodeLevel(node);

    if (compareLevel >= level) {
      cm.foldCode({ line, ch: 0 }, rangeFinder, 'fold');
    }

    line -= 1;
  }
}

// Interaction tools.
// =============================================================================

/**
 * Compares a click event with the current CodeMirror cursor position.
 * Use this when listening for clicks in a editor that then trigger some actions
 * based on where the cursor is, and you want to make sure that where the user
 * clicked is actually where the cursor is.
 *
 * @param {CodeMirror} cm - the CodeMirror instance
 * @param {Event} event - event object from click action
 * @param {Number} bufferX - horizontal buffer space to check around the cursor's
 *          x-axis. Since the CodeMirror cursor is usually 1-pixel wide, a default
 *          value of 10pixels is provided.
 * @param {Number} bufferY - vertical buffer space to check around the cursor's
 *          y-axis. Since the CodeMirror cursor usually has a height, the default
 *          value of this buffer is zero.
 * @return {Boolean} - `true` if an event's coordinates is in or near the cursor.
 *          `false` if not.
 */
export function clickIsAtCursorPosition(cm, event, bufferX = 10, bufferY = 0) {
  const cursor = cm.cursorCoords(true, 'window');
  const withinX = (event.x >= cursor.left - bufferX) && (event.x <= cursor.right + bufferX);
  const withinY = (event.y >= cursor.top - bufferY) && (event.y <= cursor.bottom + bufferY);

  // Return true if click is between the minimum and max bounds of the cursor
  // (including the buffer)
  return (withinX && withinY);
}

// Position and index conversion helpers.
// =============================================================================

export function positionFromLineStart(doc, line) {
  return { line, ch: 0 };
}

export function positionFromLineEnd(doc, line) {
  const lineContent = doc.getLine(line) || '';
  return { line, ch: lineContent.length };
}

export function indexFromLineStart(doc, line) {
  const pos = positionFromLineStart(doc, line);
  return doc.indexFromPos(pos);
}

export function indexFromLineEnd(doc, line) {
  const pos = positionFromLineEnd(doc, line);
  return doc.indexFromPos(pos);
}

export function indexesFromLineRange(doc, fromLine, toLine) {
  return {
    start: indexFromLineStart(doc, fromLine),
    end: indexFromLineEnd(doc, toLine),
  };
}
