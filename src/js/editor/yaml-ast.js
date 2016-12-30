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

ANCHOR REFERENCE (type 4)
This node is a reference to a previously defined anchor. (An anchor must already
be defined earlier in a YAML document before it can be referenced by a later
node.)  This node will have a `referencesAnchor` property, and its `value`
property will be the node that it references (including its original start and
end position), so it's very easy to find again. Nodes that define an anchor
will have an additional `anchorId` property (which will match `referencesAnchor`).
Nodes that can have anchors include scalars, maps, and sequences.

There is another node kind called INCLUDE_REF, but I don't know what that is
and how it should be used.
*/
export const YAML_SCALAR = 0;
export const YAML_MAPPING = 1;
export const YAML_MAP = 2;
export const YAML_SEQUENCE = 3;
export const YAML_ANCHOR_REF = 4;
// export const YAML_INCLUDE_REF = 5;

/**
 * Given a parsed syntax tree of YAML, and a position index, return
 * the deepest node that contains that position. Returns `null` if not found.
 *
 * When does a node not exist?
 *
 * The YAML abstract syntax tree parser will create a node whose value is `null`
 * in these conditions:
 *
 *  - The document is blank (e.g. an empty string)
 *  - There is an error, and that portion of the document cannot be parsed.
 *
 * Additionally, `getNodeAtIndex()` (and similar functions in this module) will
 * return `null` when a node cannot be found in the tree that matches the
 * arguments provided. In this case, a given index may not actually lead to a
 * YAML node. This can happen if:
 *
 *  - The line is blank between mapping items. (NOTE: blank lines between
 *      sequence items do return a node - they are considered part of the range
 *      for a sequence.)
 *  - The content is a comment following a scalar value. (NOTE: comments after
 *      mapping keys are still part of the mapping node - they are considered
 *      part of the range for a mapping node, although its content is ignored.)
 *
 * @param {YAMLNode} ast - a parsed syntax tree object, should be root of the tree
 * @param {Number} index - a position index
 * @returns {Object} a node, or null if not found
 */
export function getNodeAtIndex(ast, index) {
  function searchNodes(node, idx) {
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
        if (idx >= node.startPosition && idx <= node.endPosition) {
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
export function getNodeAtKeyAddress(ast, address) {
  function searchNodes(node, stack) {
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
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
 * Scalar nodes that are children of anchor reference nodes are skipped.
 * This is because these nodes reference the original scalar nodes, so they're
 * not clones. A referenced node can't be traced back to its anchor reference
 * when it's returned by itself, since its parent is its original source parent,
 * not the anchor reference parent. If `includeRefs` is `true`, the node returned
 * is the anchor reference node itself with the scalar node as a `value`.
 *
 * @param {YAMLNode} ast - a parsed syntax tree object, should be root of the tree
 * @param {Number} fromIndex - a position index at start of range
 * @param {Number} toIndex - a position index at end of range
 * @param {Boolean} includeRefs - if `true`, includes anchor references in the
 *          returned array of scalar nodes. Defaults to `false`.
 * @returns {Array} foundNodes - array of scalar nodes that overlap this range.
 */
export function getScalarNodesInRange(ast, fromIndex, toIndex, includeRefs = false) {
  function findNodes(node, start, end, initial = []) {
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
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
      // If `includeRefs` is `true`, add to the array if its value is a scalar.
      case YAML_ANCHOR_REF:
        // `node.value` is `undefined` if a reference anchor refers to some
        // value that does not exist.
        if (includeRefs && node.value && node.value.kind === YAML_SCALAR) {
          found.push(node);
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
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
    if (!currentNode) return stack;

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
 * Given an AST node, return its key value or the key value of its closest
 * ancestor.
 *
 * @param {YAMLNode} node - a node from YAML-AST-parser
 * @returns {string | null} keyName - a single value, like "order" or "color",
 *        or `null` if a key name cannot be determined
 */
export function getKeyNameForNode(node) {
  function traverser(currentNode) {
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
    if (!currentNode) return null;

    // If this node has a key, and it is a scalar value, return it
    if (currentNode.key && currentNode.key.kind === YAML_SCALAR) {
      return currentNode.key.value;
    }

    // Otherwise, traverse parents until we hit no more parents
    if (currentNode.parent) {
      return traverser(currentNode.parent);
    }

    return null;
  }

  return traverser(node);
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
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
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

/**
 * Given a node, traverse parents until we find the nearest ancestor with a
 * `key` property and return that node
 *
 * @param {YAMLNode} node - the node we want to find the key for
 * @param {YAMLNode | null} node - key node or null if not found
 */
export function getKeyValueOfNode(node) {
  function findKeyNode(currentNode) {
    if (currentNode.key) return currentNode.key.value;
    if (currentNode.parent) return findKeyNode(currentNode.parent);
    return null;
  }

  return findKeyNode(node);
}

/**
 * Given a sequence node, return an array of all scalar values in the sequence
 * as strings. On errors, return an empty array. Skip child nodes that do not
 * contain scalar values. Do not traverse more than one level.
 *
 * @param {YAMLNode} node - the sequence node we want to extract values from
 * @returns {Array} values - array of scalar values.
 */
export function getValuesFromSequenceNode(node) {
  if (node.kind !== YAML_SEQUENCE) return [];

  const items = [];
  node.items.forEach((item) => {
    if (item.kind === YAML_SCALAR) {
      items.push(item.value);
    }
  });

  return items;
}
