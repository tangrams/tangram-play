import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';

import TANGRAM_API from '../tangram-api.json';
import { editor } from './editor';
import { getIndexAtCursor } from './codemirror/tools';
import { getNodeLevel, getNodeAtIndex, getKeyAddressForNode, getKeyNameForNode } from './yaml-ast';
import { getCompiledValueByAddress } from '../editor/codemirror/yaml-tangram';
import { tangramLayer } from '../map/map';
import EventEmitter from '../components/event-emitter';

const keySuggestions = [];
const valueSuggestions = [];
// temp: debug
window.keySuggestions = keySuggestions;
window.valueSuggestions = valueSuggestions;

// MIGRATE deprecated helper functions that are only used here.

// Escape regex special characters
// via http://stackoverflow.com/a/9310752
function regexEscape(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

class Suggestion {
  constructor(datum) {
    if (datum.address) {
      this.checkAgainst = 'address';
    } else if (datum.key) {
      this.checkAgainst = 'key';
    }

    this.checkPattern = datum[this.checkAgainst];

    if (datum.level) {
      this.level = datum.level;
    }

    if (datum.options) {
      this.options = datum.options;
    }

    if (datum.source) {
      this.source = datum.source;
    }

    if (datum.defaultValue) {
      this.defaultValue = datum.defaultValue;
    }
  }

  check(node, ignoreLevel) {
    if (node && this.checkAgainst) {
      let rightLevel = true;
      if (!ignoreLevel && this.level) {
        rightLevel = getNodeLevel(node) === this.level;
      }

      // Simpler, non-regex check for keys
      if (this.checkAgainst === 'key') {
        return this.checkPattern === node.key;
      }

      return RegExp(this.checkPattern).test(node[this.checkAgainst]) && rightLevel;
    }

    return false;
  }

  getList(node) {
    const scene = tangramLayer.scene;
    const list = [];
    let presentNodes = [];

    // Add options
    if (this.options) {
      Array.prototype.push.apply(list, this.options);
    }

    // Add sources
    if (this.source) {
      const obj = getCompiledValueByAddress(scene, this.source);
      const keyFromSource = obj ? Object.keys(obj) : [];
      Array.prototype.push.apply(list, keyFromSource);
    }

    // Take out present keys
    const obj = getCompiledValueByAddress(scene, node.address);
    presentNodes = obj ? Object.keys(obj) : [];
    for (let j = list.length - 1; j >= 0; j--) {
      if (presentNodes.indexOf(list[j]) > -1) {
        list.splice(j, 1);
      }
    }

    return list;
  }
}

function getDefaultValue(address, completion) {
  const key = {
    address: `${address}:${completion}`,
    key: completion,
    value: '',
  };
  let defaultValue = '';
  for (const suggestion of valueSuggestions) {
    if (suggestion.check(key, true)) {
      defaultValue = suggestion.defaultValue || '';
      break;
    }
  }
  return defaultValue;
}

export function initSuggestions() {
  // Initialize tokens
  for (const datum of TANGRAM_API.keys) {
    keySuggestions.push(new Suggestion(datum));
  }

  // Initialize tokens
  for (const datum of TANGRAM_API.values) {
    valueSuggestions.push(new Suggestion(datum));
  }

  // Trigger hint after each time the scene is uploaded
  EventEmitter.subscribe('tangram:sceneupdate', (args) => {
    // Bail if editor is in read-only mode, or if the showHint addon is not
    // defined on the editor.
    if (editor.isReadOnly() || !editor.showHint) return;

    // Get the node at the current cursor location
    const doc = editor.getDoc();
    const node = getNodeAtIndex(doc.yamlNodes, getIndexAtCursor(doc));

    // Bail if there is no YAML node.
    if (!node) return;

    // Bail if the node is is not of type scalar or mapping? (this is currently
    // checked later, in the hint() method. Revisit this later.)

    // Don't open hints on GLSL or JavaScript strings. This is using the old
    // CodeMirror parser way of knowing whether something is GLSL or JS. This
    // might not be so bad, because we are already using CM to know language
    // for syntax highlighting. In this case we can easily defer to CM as the
    // source of truth for language type and not try to re-analyze this
    // ourselves. However, let's try to make this less error prone.
    const line = editor.getCursor().line;
    const stateAfter = editor.getLineHandle(line).stateAfter;
    if (stateAfter && stateAfter.innerMode && stateAfter.innerMode.helperType) {
      const helperType = stateAfter.innerMode.helperType;
      if (helperType === 'glsl' || helperType === 'javascript') return;
    }

    editor.showHint({
      completeSingle: false,
      alignWithWord: true,
      closeCharacters: /[\s()[\]{};:>,]/,
      customKeys: {
        Tab: (cm, handle) => {
          cm.replaceSelection(Array(cm.getOption('indentUnit') + 1).join(' '));
        },
        Up: (cm, handle) => {
          handle.moveFocus(-1);
        },
        Down: (cm, handle) => {
          handle.moveFocus(1);
        },
        PageUp: (cm, handle) => {
          handle.moveFocus(-handle.menuSize() + 1, true);
        },
        PageDown: (cm, handle) => {
          handle.moveFocus(handle.menuSize() - 1, true);
        },
        Home: (cm, handle) => {
          handle.setFocus(0);
        },
        End: (cm, handle) => {
          handle.setFocus(handle.length - 1);
        },
        Enter: (cm, handle) => {
          handle.pick();
        },
        Esc: (cm, handle) => {
          handle.close();
        },
      },
    });
  });
}

export function hint(cm, options) {
  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  const cursorIndex = doc.indexFromPos(cursor); // -> Number
  const node = getNodeAtIndex(doc.yamlNodes, cursorIndex);
  let list = [];
  let isKey = false;

  // Node is null if unparseable. This needs to be handled better, because
  // you can still offer a suggestion before a node is completed.
  if (!node) return '';

  if (node.kind === 0) {
    // Things we need to know to match address
    node.address = getKeyAddressForNode(node);

    // use value suggestion
    for (const datum of valueSuggestions) {
      // todo: rewrite the check
      if (datum.check(node)) {
        list.push(...datum.getList(node));
        break;
      }
    }
  } else if (node.kind === 1) {
    isKey = true;
    // get key value to check
    // Verify correct address here if someone is typing a new key
    node.key = getKeyNameForNode(node);

    // this is a mapping with a key prop - use node.key info
    for (const datum of keySuggestions) {
      // todo: rewrite the check
      if (datum.check(node)) {
        list.push(...datum.getList(node));
      }
    }
  }
  // TODO: If it's not a node we can use, return a null `result` value; avoid
  // doing all this extra work coming up next

  // The start and end position of the value to replace will come from our node
  const from = doc.posFromIndex(node.startPosition);
  const to = doc.posFromIndex(node.endPosition);

  // If the word has already begun to be typed, filter outcome
  // Get currently written word
  let string = cm.getRange(from, to);
  string = regexEscape(string);

  if (string !== '') {
    const matchedList = [];
    const match = RegExp(`^${string}.*`);
    for (let i = 0; i < list.length; i++) {
      if (list[i] !== string && match.test(list[i])) {
        matchedList.push(list[i]);
      }
    }
    list = matchedList;
  }

  const result = { list, from, to };
  const address = getKeyAddressForNode(node);
  CodeMirror.on(result, 'pick', (completion) => {
    // If we are autocompleting a key, also put in the default value
    if (isKey) {
      const defaultValue = getDefaultValue(address, completion);
      cm.replaceRange(`: ${defaultValue}`, {
        line: result.to.line,
        ch: result.to.ch + completion.length,
      }, {
        line: result.to.line,
        ch: result.to.ch + completion.length + 1,
      }, 'autocomplete');
    }
  });

  return result;
}
