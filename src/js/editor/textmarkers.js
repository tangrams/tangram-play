import React from 'react';
import ReactDOM from 'react-dom';
import { filter } from 'lodash';
import ColorMarker from '../components/textmarkers/color/ColorMarker';
import DropdownMarker from '../components/textmarkers/DropdownMarker';
// import VectorPicker from '../components/textmarkers/vector/VectorPicker';
import BooleanMarker from '../components/textmarkers/BooleanMarker';
import EventEmitter from '../components/event-emitter';
import { editor } from './editor';
import { indexesFromLineRange } from './codemirror/tools';
import {
  YAML_ANCHOR_REF,
  getScalarNodesInRange,
  getKeyNameForNode,
  getValuesFromSequenceNode,
  getKeyAddressForNode,
} from './yaml-ast';
import { applySyntaxHighlighting } from './imports';
import TANGRAM_API from '../tangram-api.json';

function makeTextMarkerConstructionKit(tangramAPIValues) {
  const filtered = filter(tangramAPIValues, item =>
    item.type === 'color' || item.type === 'vector' ||
    item.type === 'boolean' || item.type === 'string' || item.type === 'link'
  );

  return filtered.map((item) => {
    const modified = Object.assign({}, item);

    // Text markers exist for different types of Tangram scene syntax.
    //      value - a marker exists for this type of value (not used?)
    //      key - a marker exists when the key matches this
    //      address - a marker exists when the address (sequence of keys)
    //          matches this
    // This normalizes the syntax matching method to a single property.
    if (Object.prototype.hasOwnProperty.call(modified, 'key')) {
      modified.matchAgainst = 'key';
      modified.matchPattern = modified.key;
    } else if (Object.prototype.hasOwnProperty.call(modified, 'address')) {
      modified.matchAgainst = 'address';
      modified.matchPattern = modified.address;
    }

    return modified;
  });
}

// Only certain types of values in Tangram syntax will have textmarkers, so
// filter out all other ones.
const listOfTextMarkerConstructors = makeTextMarkerConstructionKit(TANGRAM_API.values);

/**
 * Get text marker constructors for each AST node
 * TODO: This is a slow function. We should speed it up. According to the Chrome
 * profiler this can take longer than the actual creation of a text marker DOM element.
 *
 * @param {Array} nodes - nodes to search through
 * @param {Array} marks - array of TextMarkers to build
 */
export function getTextMarkerConstructors(nodes) {
  const marks = [];

  // Find text marker constructors that match each node
  nodes.forEach((node) => {
    // Compare node against all available marker types
    for (const mark of listOfTextMarkerConstructors) {
      if (mark.matchAgainst === 'key') {
        const key = getKeyNameForNode(node);
        const check = (mark.matchPattern === key);

        // If a matching mark type is found, make a copy of it and store
        // information about the node.
        if (check) {
          const clone = Object.assign({}, mark);
          const address = getKeyAddressForNode(node);
          clone.key = key;
          clone.address = address;
          clone.node = node;
          marks.push(clone);
          break;
        }
      } else if (mark.matchAgainst === 'address') {
        const address = getKeyAddressForNode(node);
        const check = RegExp(mark.matchPattern).test(address);
        if (check) {
          const clone = Object.assign({}, mark);
          clone.address = address;
          clone.node = node;
          marks.push(clone);
          break;
        }
      }
    }
  });

  // Special case right now: color markers might actually be arrays
  // we should filter out and collapse marks that:
  // (a) match the same address
  // (b) have the `type` of "color"
  // - replace the node with the parent node
  const filteredMarks = marks.reduce((accumulator, mark) => {
    // Automatically pass through any marker not of type `color`
    if (mark.type !== 'color') {
      accumulator.push(mark);
      return accumulator;
    }

    // Compare this mark's address with the last item on the accumulator
    if (accumulator.length === 0 || accumulator[accumulator.length - 1].address !== mark.address) {
      // Replace the reference node with parent if it's a member of a sequence
      // colors can also be strings, if that's true, it should stay the same
      if (mark.node.parent.kind === 3) {
        mark.node = mark.node.parent;
      }
      accumulator.push(mark);
    }

    return accumulator;
  }, []);

  return filteredMarks;
}

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
 * Creates an that CodeMirror inserts as the text marker's DOM node. This element
 * is merely an empty container that React later mounts into.
 *
 * @returns {Element} - empty element used as React root element.
 **/
function createTextMarkerRootElement() {
  const el = document.createElement('div');
  el.className = 'textmarker-root';
  return el;
}

/**
 * Creates and renders DOM elements for text markers that need them.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor
 * @param {YAMLNode} node - YAML abstract syntax tree root node
 * @param {Object} mark - information about the text marker to add
 */
function createAndRenderTextMarker(doc, node, mark) {
  const markerRootEl = createTextMarkerRootElement();
  const markerPos = doc.posFromIndex(node.endPosition);
  const marker = doc.setBookmark(markerPos, {
    widget: markerRootEl, // a DOM element inserted at marker position
    insertLeft: true,
    clearWhenEmpty: true,
    handleMouseEvents: false,
  });

  // Get the actual node if the marker is on an anchor reference.
  const sourceNode = (node.kind === YAML_ANCHOR_REF) ? node.value : node;

  // Add a reference to the YAMLNode on the marker.
  marker.node = node;

  // Create the text marker element
  let markerEl = null;
  switch (mark.type) {
    case 'color': {
      // A color value may be a string or an array of values.
      const value = sourceNode.value || getValuesFromSequenceNode(sourceNode);

      markerEl = <ColorMarker marker={marker} value={value} />;
      break;
    }
    case 'string':
      // We need to pass a few more values to the dropdown mark: a set of
      // options, a key, and a sources string
      markerEl = (
        <DropdownMarker
          keyName={getKeyNameForNode(node)}
          marker={marker}
          options={mark.options}
          source={mark.source}
          initialValue={sourceNode.value}
        />
      );
      break;
    case 'boolean':
      markerEl = <BooleanMarker marker={marker} value={sourceNode.value} />;
      break;
    // Disabling vector for now
    // case 'vector':
    //   markerEl = <VectorPicker marker={marker} />;
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
  const doc = cm.getDoc();
  const range = indexesFromLineRange(doc, fromLine, toLine);
  const nodes = getScalarNodesInRange(ast, range.start, range.end, true);
  const marks = getTextMarkerConstructors(nodes);
  const readOnly = cm.isReadOnly();

  for (const mark of marks) {
    const pos = doc.posFromIndex(mark.node.endPosition);
    // Skip markers already present, or on folded lines
    if (isTextMarkerAlreadyInDocument(doc, pos) === false && cm.isFolded(pos) !== true) {
      if (mark.type === 'link') {
        // This is a marked range, not a DOM node. Still apply this in read-only docs
        applySyntaxHighlighting(doc, mark.node);
      } else if (!readOnly) {
        // Bail if editor is in read-only mode
        // TODO: better way of handling this.
        // This is for text markers that have DOM nodes (like the color picker)
        createAndRenderTextMarker(doc, mark.node, mark);
      }
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
  insertTextMarkers(cm, cm.getDoc().yamlNodes, viewport.from, viewport.to);
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
export function getExistingTextMarkers(cm, fromLine, toLine = fromLine) {
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
export function clearTextMarkers(cm, fromLine, toLine) {
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

    insertTextMarkers(cm, cm.getDoc().yamlNodes, fromLine, toLine);
  }
}

/**
 * Handler function for the CodeMirror `scroll` and `viewportChange` event.
 * As the different parts of the viewport come into view, insert editor marks
 * that may come into view.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor, automatically
 *          passed in by CodeMirror's event listener.
 */
function handleEditorViewportChange(cm) {
  insertTextMarkersInViewport(cm);
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
  // When we scroll or resize the editor, we insert new marks that appear
  editor.on('scroll', handleEditorViewportChange);
  // Don't use `viewportChange` - this also fires when a new scene is opened
  // and content is replaced, which adds new markers on top of old ones - it's
  // super buggy.
  // editor.on('viewportChange', handleEditorViewportChange);
  EventEmitter.subscribe('divider:reposition', () => {
    handleEditorViewportChange(editor);
  });
}
