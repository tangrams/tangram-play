import React from 'react';
import ReactDOM from 'react-dom';
import ColorBookmark from '../components/pickers/color/ColorBookmark';
import WidgetDropdown from '../components/widgets/WidgetDropdown';
// import VectorPicker from '../components/pickers/vector/VectorPicker';
import BooleanMarker from '../components/widgets/BooleanMarker';
import { editor, parsedYAMLDocument } from './editor';
import { indexesFromLineRange } from './codemirror/tools';
import { getScalarNodesInRange, getKeyValueOfNode } from './yaml-ast';
import { getTextMarkerConstructors } from './codemirror/bookmarks';

function isTextMarkerAlreadyInDocument(doc, pos) {
  const marks = doc.findMarksAt(pos);

  // If there is a text marker already inserted, return true
  for (const mark of marks) {
    if (mark.type === 'bookmark') {
      return true;
    }
  }

  // If there is no text marker at this location return false
  return false;
}

/**
 * Creates an that CodeMirror inserts as the bookmark's DOM node. This element
 * is merely an empty container that React later mounts into.
 *
 * @returns {Element} - empty element used as React root element.
 **/
function createTextMarkerRootElement() {
  const el = document.createElement('div');
  el.className = 'editor-bookmark-root';
  return el;
}

/**
 * Parses the CodeMirror document from `fromLine` to `toLine` and inserts text
 * markers where needed. Do not insert markers for read-only documents, since
 * their presence implies values can be changed.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {YAMLNode} ast - YAML abstract syntax tree root node
 * @param {Number} fromLine - The line number to insert from
 * @param {Number} toLine - Optional. The line number to insert to. If not
 *          provided, just the fromLine is checked.
 */
function createAndRenderTextMarker(doc, node, mark) {
  const markerRootEl = createTextMarkerRootElement();
  const markerType = mark.type;
  const markerPos = doc.posFromIndex(node.endPosition);
  const marker = doc.setBookmark(markerPos, {
    widget: markerRootEl, // a DOM element inserted at marker position
    insertLeft: true,
    clearWhenEmpty: true,
    handleMouseEvents: false,
  });

  // Add a reference to the YAMLNode on the marker.
  marker.node = node;

  // Create the text marker element
  let markerEl = null;
  switch (markerType) {
    case 'color':
      markerEl = <ColorBookmark marker={marker} value={node.value} shader={false} />;
      break;
    case 'string':
      // We need to pass a few more values to the dropdown mark: a set of
      // options, a key, and a sources string
      markerEl = (
        <WidgetDropdown
          keyName={getKeyValueOfNode(node)}
          marker={marker}
          options={mark.options}
          source={mark.source}
          initialValue={node.value}
        />
      );
      break;
    case 'boolean':
      markerEl = <BooleanMarker marker={marker} value={node.value} />;
      break;
    // Disabling vector for now
    // case 'vector':
    //   markerEl = <VectorPicker bookmark={mybookmark} />;
    //   break;
    default:
      break;
  }

  // Insert the text marker into CodeMirror DOM
  if (markerEl) {
    ReactDOM.render(markerEl, markerRootEl);
  }
}

/**
 * Parses the CodeMirror document from `fromLine` to `toLine` and inserts text
 * markers where needed. Do not insert markers for read-only documents, since
 * their presence implies values can be changed.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {YAMLNode} ast - YAML abstract syntax tree root node
 * @param {Number} fromLine - The line number to insert from
 * @param {Number} toLine - Optional. The line number to insert to. If not
 *          provided, just the fromLine is checked.
 */
export function insertTextMarkers(cm, ast, fromLine, toLine) {
  // Bail if editor is in read-only mode
  if (cm.isReadOnly()) return;

  const doc = cm.getDoc();
  const range = indexesFromLineRange(doc, fromLine, toLine);
  const nodes = getScalarNodesInRange(ast, range.start, range.end);
  const marks = getTextMarkerConstructors(nodes);

  for (const mark of marks) {
    const pos = doc.posFromIndex(mark.node.endPosition);
    if (isTextMarkerAlreadyInDocument(doc, pos) === false) {
      createAndRenderTextMarker(doc, mark.node, mark);
    }
  }
}

/**
 * A convenience function using insertMarks() to insert all marks in the
 * current visible viewport.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 */
export function insertTextMarkersInViewport(cm) {
  const viewport = cm.getViewport();
  insertTextMarkers(cm, parsedYAMLDocument.nodes, viewport.from, viewport.to);
}

/**
 * Returns an array of existing text markers between a range of lines.
 * This abstracts over CodeMirror's `findMarks()` method, which requires
 * giving it character positions, and does not find markers that are located
 * at the edge of a character range (you would need `findMarksAt()` for that).
 * Furthermore, `findMarks()` fails to locate marks on blank lines within the
 * given range.
 *
 * In our implementation, you only need to provide line numbers, and we'll
 * iterate through each line, calling `findMarks` and `findMarksAt` to make
 * sure that all markers on those lines are found.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {Number} fromLine - The line number to start looking from
 * @param {Number} toLine - Optional. The line number to look to. If not
 *          provided, just the fromLine is checked.
 */
function getExistingTextMarkers(cm, fromLine, toLine = fromLine) {
  const doc = cm.getDoc();
  let markers = [];

  for (let line = fromLine; line <= toLine; line++) {
    const lineContent = doc.getLine(line) || '';

    // Create position objects representing the range of this line
    const fromPos = { line, ch: 0 };
    const toPos = { line, ch: lineContent.length };

    // Look for existing text markers within this range
    const foundMarks = doc.findMarks(fromPos, toPos) || [];
    markers = markers.concat(foundMarks);

    // `findMarks()` does not find markers at the outer edge of a range.
    // Nor will it find markers located on blank lines, even if it is within
    // the range. So we must specifically check the end of each line,
    // including position 0 of a blank line, for a marker.
    const trailingMarks = doc.findMarksAt(toPos);
    markers = markers.concat(trailingMarks);
  }

  // Filter out anything that is not of type `bookmark`. Text markers in
  // CodeMirror can come from other sources, such as the matching-brackets
  // plugin for CodeMirror. We only want markers attached by Tangram Play.
  // `widgetNode` is CodeMirror's reference to the marker's DOM element.
  markers = markers.filter(marker =>
    marker.type === 'bookmark' && {}.hasOwnProperty.call(marker, 'widgetNode'));

  return markers;
}

/**
 * Removes all existing text markers.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {Number} fromLine - The line number to clear from
 * @param {Number} toLine - Optional. The line number to clear to. If not
 *          provided, just the fromLine is checked.
 */
function clearTextMarkers(cm, fromLine, toLine) {
  const markers = getExistingTextMarkers(cm, fromLine, toLine);

  // And remove them, if present.
  for (const marker of markers) {
    ReactDOM.unmountComponentAtNode(marker.replacedWith);
    marker.clear();
  }
}

/**
 * Handler function for the CodeMirror `changes` event.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {Array} changes - an array of change objects representing changes in
 *          editor content.
 */
function handleEditorChanges(cm, changes) {
  // This should be handled by the main editor change handler, but since these
  // are both triggered by events, it's possible this executes first, so we have
  // to force regeneration anyway. TODO: fix this
  parsedYAMLDocument.regenerate(cm.getDoc().getValue());

  for (const change of changes) {
    // Each change object specifies a range of lines
    const fromLine = change.from.line;
    let toLine = change.to.line;

    // In some cases we clear all original text markers first before adding them.
    // Changes from a picker/popup will declare its origin as `+value_change`.
    // Don't clear marks first, which causes the pickers to lose contact with
    // the original text marker.
    if (!(change.origin === '+value_change' && fromLine === toLine)) {
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

      clearTextMarkers(cm, fromLine, toLine);
    }

    insertTextMarkers(cm, parsedYAMLDocument.nodes, fromLine, toLine);
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
  insertTextMarkers(cm, parsedYAMLDocument.nodes, viewport.from, viewport.to);
}

/**
 * Initializes marks in the current editor viewport and adds event listeners
 * to handle new marks that need to be created as the editor content is
 * changed or scrolled. These listeners are applied on the entire editor
 * instance, not on the document.
 */
export function initTextMarkers() {
  // On initialization, insert all marks in the current viewport.
  insertTextMarkersInViewport(editor);

  // On editor changes, update those marks
  editor.on('changes', handleEditorChanges);

  // CodeMirror only parses lines inside of the current viewport.
  // When we scroll, we start inserting marks on lines as they're parsed.
  editor.on('scroll', handleEditorScroll);
}
