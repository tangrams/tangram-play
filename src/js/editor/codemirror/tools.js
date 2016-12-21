//  GET Functions
//  ===============================================================================
import { isEmptyString } from '../../tools/helpers';

//  Get the spaces of a string
export function getSpaces(str) {
  const regex = /^(\s+)/gm;
  const space = regex.exec(str);
  if (space) {
    return (space[1].match(/\s/g) || []).length;
  }

  return 0;
}

//  Get the indentation level of a line
export function getLineInd(cm, line) {
  return getSpaces(cm.lineInfo(line).text) / cm.getOption('tabSize');
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

// Get the text of a line and ignore the previus spaces
export function getText(cm, nLine) {
  const value = /^\s*(\w+)/gm.exec(cm.lineInfo(nLine).text);
  return value ? value[1] : '';
}

//  Get value of a key pair
export function getValue(cm, nLine) {
  const value = /^\s*\w+:\s*([\w|\W|\s]+)$/gm.exec(cm.lineInfo(nLine).text);
  return value ? value[1] : '';
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

  let line = cm.lineCount() - 1;
  while (line >= 0) {
    if (getLineInd(cm, line) >= level) {
      cm.foldCode({ line, ch: 0 }, rangeFinder);
    }
    line -= 1;
  }
}
