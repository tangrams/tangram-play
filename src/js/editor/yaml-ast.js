import YAMLParser from 'yaml-ast-parser';
import { addressFromKeyStack, keyStackFromAddress } from './codemirror/yaml-tangram';

/*
YAML node kinds are assigned a number by YAMLParser.

SCALAR (type 0)
This is the simplest node type. Its most important property is `value`, which
is a string. It has no other child nodes. Its parent may be a MAPPING or a
SEQUENCE node.

MAPPING (type 1)
This is a key-value pair. It contains a `key` property as well as a `value`
property. Values are child nodes and can be a SCALAR, MAP, or a SEQUENCE node.
Its parent node is a MAP.

MAP (type 2)
Similarly named to MAPPING, it is a related concept. The best way to think
about this is that MAPS are collections of MAPPINGS. It does not have a `value`
property but rather a `mappings` property which is an array of MAP nodes. Its
parent is usually a MAPPING. At the top level of a Tangram YAML document, the
root node (which has no parents) should be a MAP.

SEQUENCE (type 3)
This node is an array of items. It does not have a `value` property but rather
an `items` array of one or more YAML nodes. In Tangram YAML, child nodes are
usually SCALARS.

Other node kinds exist, but we currently don't handle this here. We still need
to understand what they are and whether they are used by Tangram YAML.
*/
export const YAML_SCALAR = 0;
export const YAML_MAPPING = 1;
export const YAML_MAP = 2;
export const YAML_SEQUENCE = 3;
// export const YAML_ANCHOR_REF = 4;
// export const YAML_INCLUDE_REF = 5;

function parseYAML(content) {
  // Run all the content through the AST parser and store it here.
  // Timing of safeLoad: about 0.5-1.5ms for a small file, could be 20ms+ for a 6000 line Cinnabar.
  // `parsedYAML` will be undefined if content is blank (e.g. empty string)
  const parsedYAML = YAMLParser.safeLoad(content);

  if (parsedYAML && parsedYAML.errors.length > 0) {
    // TODO: Handle errors?
  }

  return parsedYAML;
}

/**
 * Given a parsed syntax tree of YAML, and a position index, return
 * the deepest node that contains that position. Returns nothing if not found.
 *
 * @param {YAMLNode} ast - a parsed syntax tree object, should be root of the tree
 * @param {Number} index - a position index
 * @returns {Object} a node
 */
function getNodeAtIndex(ast, index) {
  function searchNodes(node, idx) {
    // Nodes can be `null` if current document is blank or has errors
    if (!node) return null;

    if (idx < node.startPosition || idx > node.endPosition) {
      if (node.parent) return node.parent;
    }

    switch (node.kind) {
      // A scalar node has no further depth; return as is.
      case YAML_SCALAR:
        return node;
      case YAML_MAPPING:
        return searchNodes(node.value, idx);
      case YAML_MAP:
        // Find the first node in node.mappings that contains idx and
        // continue searching
        for (let i = 0, j = node.mappings.length; i < j; i++) {
          const mapping = node.mappings[i];
          // Can be null if document has errors
          if (!mapping) return null;
          if (idx >= mapping.startPosition && idx <= mapping.endPosition) {
            return searchNodes(mapping.value, idx);
          }
        }
        return null;
      case YAML_SEQUENCE:
        // See if index falls in any of the sequence items
        for (let i = 0, j = node.items.length; i < j; i++) {
          const item = node.items[i];
          // Can be null if document has errors
          if (!item) return null;
          if (idx >= item.startPosition && idx <= item.endPosition) {
            return searchNodes(item, idx);
          }
        }
        // If not, return the sequence node itself
        return node;
      default:
        if (idx >= node.startPosition && idx <= node.startPosition) {
          return node;
        } else if (node.parent) {
          return node.parent;
        }
        return null;
    }
  }

  const node = searchNodes(ast, index);
  return node;
}

/**
 * Given an address, return a node representing its value(s). This is used when
 * Tangram refers to a scene file only with address, rather than a position value
 * in a scene file.
 *
 * @param {YAMLNode} ast - a parsed syntax tree object, should be root of the tree
 * @param {string} address - an address that looks like "this:string:example"
 * @returns {Object} a node
 */
function getNodeAtKeyAddress(ast, address) {
  function searchNodes(node, stack) {
    // Nodes can be `null` if current document is blank or has errors
    if (!node) return null;

    switch (node.kind) {
      // A scalar node has no further depth; return its parent node, which
      // includes its key.
      case YAML_SCALAR:
        return node.parent;
      case YAML_MAPPING:
        return searchNodes(node.value, stack);
      case YAML_MAP:
        // Find the first node in node.mappings that contains stack[0].
        // If found, remove from stack and continue searching with remainder
        // of the stack.
        for (let i = 0, j = node.mappings.length; i < j; i++) {
          const mapping = node.mappings[i];
          // Can be null if document has errors
          if (!mapping) return null;
          if (mapping.key.value === stack[0]) {
            stack.shift();

            // If keys remain in stack, keep searching
            if (stack.length > 0) {
              return searchNodes(mapping.value, stack);
            }

            // Otherwise, return the found mapping
            return mapping;
          }
        }

        // If not found, return null.
        return null;
      // A sequence node has no further depth (in Tangram YAML anyway);
      // return its parent node, which includes its key.
      case YAML_SEQUENCE:
        return node.parent;
      default:
        return null;
    }
  }

  const stack = keyStackFromAddress(address);
  const node = searchNodes(ast, stack);
  return node;
}

/**
 * Returns an array of scalar nodes between `fromIndex` and `toIndex`.
 * Include nodes that overlap this range.
 *
 * @param {YAMLNode} ast - a parsed syntax tree object, should be root of the tree
 * @param {Number} fromIndex - a position index at start of range
 * @param {Number} toIndex - a position index at end of range
 * @returns {Array} foundNodes - array of scalar nodes that overlap this range.
 */
export function getScalarNodesInRange(ast, fromIndex, toIndex) {
  function findNodes(node, start, end, initial = []) {
    // Nodes can be `null` if current document is blank or has errors
    if (!node) return initial;

    // If the node ends before my start range, or starts after my end range,
    // this branch is not important, so we can exclude it.
    if (node.endPosition < start || node.startPosition > end) return initial;

    // Clone the array of nodes we already found
    let found = initial.slice();

    switch (node.kind) {
      // A scalar node has no further depth; return as is.
      case YAML_SCALAR:
        found.push(node);
        break;
      case YAML_MAPPING:
        found = findNodes(node.value, start, end, initial);
        break;
      case YAML_MAP:
        for (let i = 0, j = node.mappings.length; i < j; i++) {
          const mapping = node.mappings[i];

          // Can be null if document has errors
          if (!mapping) continue; // eslint-disable-line no-continue

          // Stop searching in mappings when we hit a node that lies outside range
          if (node.endPosition < start || node.startPosition > end) break;

          found = findNodes(mapping.value, start, end, found);
        }
        break;
      case YAML_SEQUENCE:
        // See if index falls in any of the sequence items
        for (let i = 0, j = node.items.length; i < j; i++) {
          const item = node.items[i];

          // Can be null if document has errors
          if (!item) continue; // eslint-disable-line no-continue

          // Stop searching in items when we hit a node that lies outside range
          if (node.endPosition < start || node.startPosition > end) break;

          found = findNodes(item, start, end, found);
        }
        break;
      // Catch-all for unhandled node types: return accrued array as-is
      default:
        break;
    }

    return found;
  }

  const foundNodes = findNodes(ast, fromIndex, toIndex, []);
  return foundNodes;
}

/**
 * Given an AST node, construct a key address for it by traversing its parent nodes.
 *
 * @param {YAMLNode} node - a node from YAML-AST-parser
 * @returns {string} address - an address that looks like "this:string:example"
 */
export function getKeyAddressForNode(node) {
  function builder(currentNode, stack = []) {
    // Nodes can be `null` if current document state has errors
    if (!currentNode) return null;

    // Add key's value to the current key stack.
    // Only accept scalar values for keys
    if (currentNode.key && currentNode.key.kind === YAML_SCALAR) {
      stack.push(currentNode.key.value);
    }

    // Traverse parents until we hit no more parents
    if (currentNode.parent) {
      stack.concat(builder(currentNode.parent, stack));
    }

    return stack;
  }

  const stack = builder(node, []);
  stack.reverse();
  return addressFromKeyStack(stack);
}

/**
 * Given an AST node, determine its level (nesting depth in YAML mappings).
 *
 * Replaces the old ways - storing keyLevel on the CodeMirror token parser,
 * or calculating the depth via a hard-coded tab indent value. This is VERY
 * fast - almost as fast as reading the keyLevel property on the token state.
 *
 * Regarding levels, and how it compares with the deprecated keyLevel method:
 * This returns `null` when there's no node, e.g. blank lines.
 * This differs from `keyLevel` implementation which is determined line by line,
 * but also requires knowledge of the previous line. Blank lines in `keyLevel`
 * implementation will pick up the level from the previous line. The YAML
 * AST parser picks up level based on the tree structure.
 *
 * `keyLevel`s suffer from a CodeMirror token parsing problem where the first
 * character of a line has the previous value, not the value for the current line.
 *
 * Level 0 is any mapping at the top-level (e.g. `import`, `styles`, `layers`).
 * Each subsequent level goes up by 1.
 *
 * In the `keyLevel` implementation, it goes up by 1 when the _line_ the node
 * is on increases. In the AST implementation, it goes up by 1 at the beginning
 * of the key, because that is where the node's startPosition is (not at the
 * beginning of a line).
 *
 * The AST implementation also correctly ignores tab indentation, and correctly
 * accounts for inline nodes. The state token implementation cannot do either of these.
 *
 * NOTE: shorten the above description once the old way is gone.
 *
 * @param {YAMLNode} node - a node from YAML-AST-parser
 * @returns {Number} level - an address that looks like "this:string:example"
 */
export function getNodeLevel(node) {
  function traverser(currentNode, level = -1) {
    // Nodes can be `null` if current document state has errors
    if (!currentNode) return null;

    let returnLevel = level;

    // For each mapping the level stack is increased by one
    if (currentNode.kind === YAML_MAPPING) {
      returnLevel += 1;
    }

    // Traverse parents until we hit no more parents
    if (currentNode.parent) {
      returnLevel = traverser(currentNode.parent, returnLevel);
    }

    return returnLevel;
  }

  const level = traverser(node);
  return level;
}

/**
 * Given an AST node, convert its `startPosition` and `endPosition` values to
 * CodeMirror editor positions.
 *
 * @param {Object} node - a node from YAML-AST-parser
 * @param {CodeMirror.doc} doc - the CodeMirror document
 * @returns {Object} range - an object of this shape:
 *        range = {
 *          from: { line, ch },
 *          to: { line, ch }
 *        }
 * @todo Does this function belong here?
 */
export function getPositionsForNode(node, doc) {
  // Returns a null object of similar shape if a node is undefined
  if (!node) {
    const nullPos = { line: null, ch: null };
    return { from: nullPos, to: nullPos };
  }

  const startPosition = doc.posFromIndex(node.startPosition);
  const endPosition = doc.posFromIndex(node.endPosition);
  return {
    from: startPosition,
    to: endPosition,
  };
}

export class ParsedYAMLDocument {
  constructor(content) {
    this.nodes = {};
    this.regenerate(content);
  }

  regenerate(content) {
    this.nodes = parseYAML(content) || {};
  }

  getNodeAtIndex(index) {
    return getNodeAtIndex(this.nodes, index);
  }

  getNodeAtKeyAddress(address) {
    return getNodeAtKeyAddress(this.nodes, address);
  }

  getScalarNodesInRange(fromIndex, toIndex) {
    return getScalarNodesInRange(this.nodes, fromIndex, toIndex);
  }
}
