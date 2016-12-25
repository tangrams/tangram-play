import React from 'react';
import ReactDOM from 'react-dom';
import ColorBookmark from '../components/pickers/color/ColorBookmark';
import WidgetDropdown from '../components/widgets/WidgetDropdown';
// import VectorPicker from '../components/pickers/vector/VectorPicker';
import WidgetToggle from '../components/widgets/WidgetToggle';
import EventEmitter from '../components/event-emitter';
import { editor, parsedYAMLDocument } from './editor';
import { indexesFromLineRange } from './codemirror/tools';
import { getScalarNodesInRange } from './yaml-ast';
import { getTextMarkerConstructors } from './codemirror/bookmarks';

function isThereMark(node) {
  const to = node.range.to;

  const doc = editor.getDoc();
  const otherMarks = doc.findMarksAt(to);

  // If there is a mark return true
  for (const mark of otherMarks) {
    if (mark.type === 'bookmark') {
      return '';
    }
  }

  // If there is no mark at this location return false
  return node;
}

/**
 * Creates an that CodeMirror inserts as the bookmark's DOM node. This element
 * is merely an empty container that React later mounts into.
 *
 * @returns {Element} - empty element used as React root element.
 **/
function createMarkRootNode(type) {
  const el = document.createElement('div');
  el.className = 'editor-bookmark-root';
  return el;
}

/**
 * Parses the editor from `fromLine` to `toLine` and inserts markers where
 * needed. Do not insert markers for read-only documents, since their presence
 * implies values can be changed.
 *
 * @param {Number} fromLine - The line number to insert from
 * @param {Number} toLine - Optional. The line number to insert to. If not
 *          provided, just the fromLine is checked.
 */
function insertMarks(fromLine, toLine = fromLine) {
  // Bail if editor is in read-only mode
  if (editor.isReadOnly()) return;

  // For each line in the range, get the line handle, check for nodes,
  // check for marks, and add or remove them.
  for (let line = fromLine; line <= toLine; line++) {
    const doc = editor.getDoc();
    const lineHandle = doc.getLineHandle(line);

    // If no lineHandle, then CodeMirror probably has not parsed it yet;
    // continue
    if (!lineHandle || !lineHandle.stateAfter) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const nodes = lineHandle.stateAfter.nodes || null;

    // If there are no nodes, go to the next line
    if (!nodes) {
      // eslint-disable-next-line no-continue
      continue;
    }

    for (let node of nodes) {
      // See if there's a bookmark constructor attached to it, and
      // if so, we create it and insert it into the document.
      // Skip blank lines, which may have the state (and bookmark
      // constructor) of the previous line.
      if (node.bookmark && lineHandle.text.trim() !== '') {
        const lineNumber = doc.getLineNumber(lineHandle);

        const mytype = node.bookmark.type;

        // TODO: What does this do?
        if (lineNumber) {
          node.range.to.line = lineNumber;
          node.range.from.line = lineNumber;
        }

        node = isThereMark(node);

        let mybookmark = {};

        if (node !== '') {
          const myel = createMarkRootNode(mytype);

          // inserts the bookmark into CodeMirror DOM
          mybookmark = doc.setBookmark(node.range.to, {
            widget: myel, // inserted DOM element into position
            insertLeft: true,
            clearWhenEmpty: true,
            handleMouseEvents: false,
          });
          // We attach only one property to a bookmark that only inline
          // bookmark will need to use to verify position within a node array
          mybookmark.widgetPos = node.range;

          if (mytype === 'color') {
            ReactDOM.render(
              <ColorBookmark bookmark={mybookmark} value={node.value} shader={false} />,
              myel
            );
          } else if (mytype === 'string') {
            // We need to pass a few more values to the dropdown
            // mark: a set of options, a key, and a sources string
            ReactDOM.render(
              <WidgetDropdown
                bookmark={mybookmark}
                options={node.bookmark.options}
                keyType={node.key}
                source={node.bookmark.source}
                initialValue={node.value}
              />,
              myel
            );
          } else if (mytype === 'boolean') {
            ReactDOM.render(<WidgetToggle bookmark={mybookmark} value={node.value} />, myel);
          }
          // Disabling vector for now
          // else if (mytype === 'vector') {
          //     ReactDOM.render(<VectorPicker bookmark={mybookmark}/>, myel);
          // }
        }
      }
    }
  }
}

/**
 * A convenience function using insertMarks() to insert all marks in the
 * current visible viewport.
 */
export function insertMarksInViewport() {
  const viewport = editor.getViewport();
  insertMarks(viewport.from, viewport.to);
}

/**
 * An experimental function for inserting marks based on a range but based on
 * the YAML abstract syntax tree.
 *
 * @todo finish this + documentation
 * Let's try this but using passed-in CodeMirror and AST instead of importing
 * them as global to the module
 */
export function insertMarksWithAST(doc, ast, fromLine, toLine) {
  const range = indexesFromLineRange(doc, fromLine, toLine);
  const nodes = getScalarNodesInRange(ast, range.start, range.end);

  // For each node mimic bookmark constructor stuff
  const marks = getTextMarkerConstructors(nodes);
  console.log(marks);
}

/**
 * Returns an array of existing marks between a range of lines.
 * This abstracts over CodeMirror's `findMarks()` method, which requires
 * giving it character positions, and does not find marks that are located
 * at the edge of a character range (you would need `findMarksAt()` for that).
 * Furthermore, `findMarks()` fails to locate marks on blank lines within the
 * given range.
 *
 * In our implementation, you only need to provide line numbers, and we'll
 * iterate through each line, calling `findMarks` and `findMarksAt` to make
 * sure that all marks on those lines are found.
 *
 * @param {Number} fromLine - The line number to start looking from
 * @param {Number} toLine - Optional. The line number to look to. If not
 *          provided, just the fromLine is checked.
 */
function getExistingMarks(fromLine, toLine = fromLine) {
  const doc = editor.getDoc();
  let existingMarks = [];

  for (let line = fromLine; line <= toLine; line++) {
    const lineContent = doc.getLine(line) || '';

    // Create position objects representing the range of this line
    const fromPos = { line, ch: 0 };
    const toPos = { line, ch: lineContent.length };

    // Look for existing text markers within this range
    const foundMarks = doc.findMarks(fromPos, toPos) || [];
    existingMarks = existingMarks.concat(foundMarks);

    // `findMarks()` does not find marks at the outer edge of a range.
    // Nor will it find marks located on blank lines, even if it is within
    // the range. So we must specifically check the end of each line,
    // including position 0 of a blank line, for a mark.
    const trailingMarks = doc.findMarksAt(toPos);
    existingMarks = existingMarks.concat(trailingMarks);
  }

  // Filter out anything that is not of type `bookmark`. Text markers in
  // CodeMirror can come from other sources, such as the matching-brackets
  // plugin for CodeMirror. We only want bookmarks attached by Tangram Play.
  // Find out: `widgetNode` is created by CodeMirror?
  existingMarks = existingMarks.filter(marker =>
    marker.type === 'bookmark' && {}.hasOwnProperty.call(marker, 'widgetNode'));

  return existingMarks;
}

/**
 * Removes all existing bookmarks.
 *
 * @param {Number} fromLine - The line number to clear from
 * @param {Number} toLine - Optional. The line number to clear to. If not
 *          provided, just the fromLine is checked.
 */
function clearMarks(fromLine, toLine) {
  const existingMarks = getExistingMarks(fromLine, toLine);

  // And remove them, if present.
  for (const bookmark of existingMarks) {
    ReactDOM.unmountComponentAtNode(bookmark.replacedWith);
    bookmark.clear();
  }
}

/**
 * Handler function for the CodeMirror `changes` event.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor.
 * @param {Array} changes - an array of change objects representing changes in
 *          editor content.
 */
function handleEditorChanges(cm, changes) {
  for (const change of changes) {
    // Each change object specifies a range of lines
    const fromLine = change.from.line;
    let toLine = change.to.line;

    // Changes from a popup will declare its origin as `+value_change`.
    if (change.origin === '+value_change' && fromLine === toLine) {
      // Just call insertMarks, which will determine whether a mark should be
      // inserted, if not already. Don't clear marks here, which causes the
      // popups to lose contact with the original bookmark.
      insertMarks(fromLine, toLine);
    } else {
      // CodeMirror's `from` and `to` properties are pre-change values, so
      // we adjust the range if lines were removed or added.
      if (change.origin === '+delete' || change.origin === 'cut') {
        // In a delete or cut operation, CodeMirror's `to` line includes lines
        // have just been removed. However, we don't want to parse those lines,
        // since they're gone. We will only reparse the current line.
        toLine = fromLine;
      } else if (change.origin === 'paste' || change.origin === 'undo') {
        // In a paste operation, CodeMirror's `to` line is the same as the
        // `from` line. We can get the correct to-line by adding the pasted
        // lines minus the removed lines. This also captures undo operations
        // where removals of lines are undone (so it works like a paste)
        // The `removed` and `text` properties are arrays which indicate how
        // many lines were removed or added respectively.
        toLine += change.text.length - change.removed.length;
      }

      clearMarks(fromLine, toLine);
      insertMarks(fromLine, toLine);
    }

    insertMarksWithAST(cm.getDoc(), parsedYAMLDocument.nodes, fromLine, toLine);
  }
}

/**
 * Handler function for the CodeMirror `scroll` event.
 * As the different parts of the viewport come into view, insert editor marks
 * that may exist in the viewport.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor, automatically
 *          passed in by the editor.on('scroll') event listener.
 */
function handleEditorScroll(cm) {
  const viewport = cm.getViewport();
  insertMarks(viewport.from, viewport.to);
}

/**
 * For inline nodes. Reparses lines that have inline nodes when a bookmark
 * changes text in the editor.
 *
 * @param {Object} data contains the position of the bookmark connected to
 *          data that the user has just edited
 */
function reparseInlineNodes(data) {
  const changedNodeCh = data.from.ch; // The first character of edited text
  const existingMarks = getExistingMarks(data.from.line, data.from.line);

  // If there is only one node in the inline line, then do not do anything
  if (existingMarks.length === 1) {
    return;
  }

  // If there is more than one node in the inline line,
  // then only remove the ones that the user has not just edited
  for (const mark of existingMarks) {
    if (mark.widgetPos.from.ch !== changedNodeCh) {
      ReactDOM.unmountComponentAtNode(mark.replacedWith);
      mark.clear();
    }
  }

  insertMarks(data.from.line, data.from.line);
}

/**
 * Initializes marks in the current editor viewport and adds event listeners
 * to handle new marks that need to be created as the editor content is
 * changed or scrolled. These listeners are applied on the entire editor
 * instance, not on the document.
 */
export function initMarks() {
  // On initialization, insert all marks in the current viewport.
  insertMarksInViewport();

  // On editor changes, update those marks
  editor.on('changes', handleEditorChanges);

  // CodeMirror only parses lines inside of the current viewport.
  // When we scroll, we start inserting marks on lines as they're parsed.
  editor.on('scroll', handleEditorScroll);

  // If an inline node is changed, we'd like to reparse all the other nodes in that line
  EventEmitter.subscribe('editor:inlinenodes', reparseInlineNodes);
}
