import CodeMirror from 'codemirror';
import YAML from 'yaml-ast-parser';

// EXPERIMENTAL: extend YAML so anchor references know what their parents are.
function findAnchorRefParents(ast) {
  // Any YAML node can have an anchor ID (which is a value prefaced with `&id`).
  // If so, the node gets an array to keep track of referenced nodes. If an
  // anchor is created, but no nodes reference it, an empty references array
  // is the desired outcome.
  function attachReferencesProperty(node) {
    // eslint-disable-next-line no-param-reassign
    if (node.anchorId && !node.references) node.references = [];
  }

  // Traverse the tree, looking for anchor ids and references.
  function traverseNodes(node) {
    // Nodes can be a null value. See documentation for `getNodeAtIndex()`.
    if (!node) return;

    // Traversing the node depth depends on the type of node it is.
    switch (node.kind) {
      case YAML.Kind.SCALAR:
        attachReferencesProperty(node);
        break;
      case YAML.Kind.MAPPING:
        attachReferencesProperty(node);
        traverseNodes(node.value);
        break;
      case YAML.Kind.MAP:
        attachReferencesProperty(node);
        for (let i = 0, j = node.mappings.length; i < j; i++) {
          const mapping = node.mappings[i];

          // Can be null if document has errors
          if (mapping) traverseNodes(mapping.value);
        }
        break;
      case YAML.Kind.SEQ:
        attachReferencesProperty(node);
        for (let i = 0, j = node.items.length; i < j; i++) {
          const item = node.items[i];

          // Can be null if document has errors
          if (!item) traverseNodes(item);
        }
        break;
      case YAML.Kind.ANCHOR_REF:
        // If the node is referencing another one, and the referenced node (`value`)
        // exists, push the node to the anchor's `references` array. Create this
        // array if it does not exist.
        if (node.value) {
          // eslint-disable-next-line no-param-reassign
          if (!node.value.references) node.value.references = [];
          node.value.references.push(node);
        }
        break;
      default:
        break;
    }
  }

  traverseNodes(ast);
  return ast;
}

function parseDoc(cm) {
  const doc = cm.getDoc();
  const content = doc.getValue();
  doc.yamlNodes = findAnchorRefParents(YAML.safeLoad(content));
}

function initYAMLParser(cm) {
  // Parse YAML abstract syntax tree when it's edited, or swapped in from elsewhere
  cm.on('changes', parseDoc);
  cm.on('swapDoc', parseDoc);
}

CodeMirror.defineInitHook(initYAMLParser);
