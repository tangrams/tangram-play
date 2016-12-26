import { filter } from 'lodash';
import TANGRAM_API from '../../tangram-api.json';
import { getKeyAddressForNode } from '../yaml-ast';

function makeTextMarkerConstructionKit(tangramAPIValues) {
  const filtered = filter(tangramAPIValues, item =>
    item.type === 'color' || item.type === 'vector' ||
    item.type === 'boolean' || item.type === 'string'
  );

  return filtered.map((item) => {
    const modified = Object.assign({}, item);

    // Bookmarks exist for different types of Tangram scene syntax.
    //      value - a bookmark exists for this type of value (not used?)
    //      key - a bookmark exists when the key matches this
    //      address - a bookmark exists when the address (sequence of keys)
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

// Only certain types of values in Tangram syntax will have bookmarks, so
// filter out all other ones.
const listOfBookmarkConstructors = makeTextMarkerConstructionKit(TANGRAM_API.values);

/**
 * Get bookmark constructors for each AST node
 *
 * @param {Array} nodes - nodes to search through
 * @param {Array} marks - array of TextMarkers to build
 */
export function getTextMarkerConstructors(nodes) {
  const marks = [];

  // Find text marker constructors that match the node
  nodes.forEach((node) => {
    // Compare node against all available marker types
    for (const mark of listOfBookmarkConstructors) {
      if (mark.matchAgainst === 'key') {
        // Get the key value of node, whch is either on its parent node,
        // or two parents up if it's part of a sequence.
        const key = node.parent.key || node.parent.parent.key;
        const check = RegExp(mark.matchPattern).test(key);

        // If a matching mark type is found, make a copy of it and store
        // information about the node.
        if (check) {
          const clone = Object.assign({}, mark);
          clone.key = key;
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
    if (mark.type !== 'color') accumulator.push(mark);

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
