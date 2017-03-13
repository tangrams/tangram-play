import CodeMirror from 'codemirror';
import YAML from 'yaml-ast-parser';

function parseDoc(cm) {
  const doc = cm.getDoc();
  const content = doc.getValue();
  doc.yamlNodes = YAML.safeLoad(content);
}

function initYAMLParser(cm) {
  // Parse YAML abstract syntax tree when it's edited, or swapped in from elsewhere
  cm.on('changes', parseDoc);
  cm.on('swapDoc', parseDoc);
}

CodeMirror.defineInitHook(initYAMLParser);
