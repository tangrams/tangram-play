// Import CodeMirror
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';

import { editor, getNodesOfLine } from './editor';
import TANGRAM_API from '../tangram-api.json';
import { tangramLayer } from '../map/map';
import EventEmitter from '../components/event-emitter';

// Load some common functions
import { getLineInd, isCommented, isEmpty, regexEscape } from '../editor/codemirror/tools';
import { getAddressSceneContent, getAddressForLevel } from '../editor/codemirror/yaml-tangram';

//  private variables
const keySuggestions = [];
const valueSuggestions = [];

class Suggestion {
  constructor(datum) {
    //  TODO: must be a better way to do this
    if (datum.address) {
      this.checkAgainst = 'address';
    } else if (datum.key) {
      this.checkAgainst = 'key';
    } else if (datum.value) {
      this.checkAgainst = 'value';
    }

    this.checkPatern = datum[this.checkAgainst];

    if (datum.keyLevel) {
      this.keyLevel = datum.keyLevel;
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

  check(node, forceLevel) {
    if (node && this.checkAgainst) {
      let rightLevel = true;
      if (!forceLevel && this.level) {
        rightLevel = getLineInd(editor, node.pos.line) === this.level;
      }
      return RegExp(this.checkPatern).test(node[this.checkAgainst]) && rightLevel;
    }

    return false;
  }

  getDefault() {
    return this.defaultValue || '';
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
      const obj = getAddressSceneContent(scene, this.source);
      const keyFromSource = obj ? Object.keys(obj) : [];
      Array.prototype.push.apply(list, keyFromSource);
    }

    // Take out present keys
    const obj = getAddressSceneContent(scene, node.address);
    presentNodes = obj ? Object.keys(obj) : [];
    for (let j = list.length - 1; j >= 0; j--) {
      if (presentNodes.indexOf(list[j]) > -1) {
        list.splice(j, 1);
      }
    }

    return list;
  }
}

function getDefault(address, completion) {
  const key = {
    address: `${address}/${completion}`,
    key: completion,
    value: '',
  };
  let defaultValue = '';
  for (const datum of valueSuggestions) {
    if (datum.check(key, true)) {
      defaultValue = datum.getDefault();
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
  EventEmitter.dispatch('tangram:sceneupdate', (args) => {
    let bOpen = true;

    const line = editor.getCursor().line;
    const stateAfter = editor.getLineHandle(line).stateAfter;
    if (stateAfter && stateAfter.innerMode && stateAfter.innerMode.helperType) {
      const helperType = stateAfter.innerMode.helperType;
      if (helperType === 'glsl' || helperType === 'javascript') {
        bOpen = false;
      }
    }

    if (isCommented(editor, line) ||
      isEmpty(editor, line)) {
      bOpen = false;
    }

    if (bOpen && editor.showHint) {
      editor.showHint({
        completeSingle: false,
        alignWithWord: true,
        closeCharacters: /[\s()\[\]{};:>,]/,
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
    }
  });
}

export function hint(cm, options) {
  const cursor = { line: cm.getCursor().line, ch: cm.getCursor().ch };
  cursor.ch -= 1;
  // console.log("Cursor", cursor);

  const range = cm.findWordAt(cursor);
  const from = range.anchor;
  const to = range.head;
  // console.log("RANGE",from,to);

  const line = cursor.line;
  let list = [];

  let wasKey = false;
  let address = '/';

  // What's the main key of the line?
  const nodes = getNodesOfLine(line);
  if (nodes) {
    // Get key pair where the cursor is
    const node = nodes[0];

    if (node) {
      // If there is no key search for a KEY
      if (node.key === '') {
        // Fallback the address to match
        const actualLevel = getLineInd(cm, line);
        address = getAddressForLevel(node.address, actualLevel);
        node.address = address;
        // Suggest key
        for (const datum of keySuggestions) {
          if (datum.check(node)) {
            list.push(...datum.getList(node));
          }
        }
        wasKey = true;
      } else {
        // if it have a key search for the value
        // Suggest value
        for (const datum of valueSuggestions) {
          if (datum.check(node)) {
            list.push(...datum.getList(node));
            break;
          }
        }
      }
      // console.log("List",list);

      // What ever the list is suggest using it
      let string = cm.getRange(from, to);
      string = regexEscape(string);

      // If the word is already begin to type, filter outcome
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
    }
  }

  const result = { list, from, to };
  CodeMirror.on(result, 'pick', (completion) => {
    // If is a key autocomplete with de default value
    if (wasKey) {
      // console.log(address+'/'+completion);
      const defaultValue = getDefault(address, completion);
      cm.replaceRange(`: ${defaultValue}`, {
        line: result.to.line,
        ch: result.to.ch + completion.length,
      }, {
        line: result.to.line,
        ch: result.to.ch + completion.length + 1,
      },
        'complete');
    }
  });

  return result;
}
