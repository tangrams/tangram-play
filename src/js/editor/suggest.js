import { editor, getNodesOfLine } from './editor';
import TangramPlay from '../tangram-play';
import TANGRAM_API from '../tangram-api.json';
import { tangramLayer } from '../map/map';

// Load some common functions
import { getLineInd, isCommented, isEmpty, regexEscape } from '../editor/codemirror/tools';
import { getAddressSceneContent, getAddressForLevel } from '../editor/codemirror/yaml-tangram';

// Import CodeMirror
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';

export default class SuggestManager {
    constructor () {
        //  private variables
        this.keySuggestions = [];
        this.valueSuggestions = [];
        this.active = undefined;

        // Initialize tokens
        for (let datum of TANGRAM_API.keys) {
            this.keySuggestions.push(new Suggestion(datum));
        }

        // Initialize tokens
        for (let datum of TANGRAM_API.values) {
            this.valueSuggestions.push(new Suggestion(datum));
        }

        // Trigger hint after each time the scene is uploaded
        TangramPlay.on('sceneupdate', (args) => {
            let bOpen = true;

            let line = editor.getCursor().line;
            let stateAfter = editor.getLineHandle(line).stateAfter;
            if (stateAfter && stateAfter.innerMode && stateAfter.innerMode.helperType) {
                let helperType = stateAfter.innerMode.helperType;
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
                        }
                    }
                });
            }
        });
    }

    hint (editor, options) {
        let cursor = { line: editor.getCursor().line, ch: editor.getCursor().ch };
        cursor.ch = cursor.ch - 1;
        // console.log("Cursor", cursor);

        let range = editor.findWordAt(cursor);
        let from = range.anchor;
        let to = range.head;
        // console.log("RANGE",from,to);

        let line = cursor.line;
        let list = [];

        let wasKey = false;
        let address = '/';

        // What's the main key of the line?
        let nodes = getNodesOfLine(line);
        if (nodes) {
            // Get key pair where the cursor is
            let node = nodes[0];

            if (node) {
                // If there is no key search for a KEY
                if (node.key === '') {
                    // Fallback the address to match
                    let actualLevel = getLineInd(editor, line);
                    address = getAddressForLevel(node.address, actualLevel);
                    node.address = address;
                    // Suggest key
                    for (let datum of this.keySuggestions) {
                        if (datum.check(node)) {
                            list.push.apply(list, datum.getList(node));
                        }
                    }
                    wasKey = true;
                }
                // if it have a key search for the value
                else {
                    // Suggest value
                    for (let datum of this.valueSuggestions) {
                        if (datum.check(node)) {
                            list.push.apply(list, datum.getList(node));
                            break;
                        }
                    }
                }
                // console.log("List",list);

                // What ever the list is suggest using it
                let string = editor.getRange(from, to);
                string = regexEscape(string);

                // If the word is already begin to type, filter outcome
                if (string !== '') {
                    let matchedList = [];
                    let match = RegExp('^' + string + '.*');
                    for (let i = 0; i < list.length; i++) {
                        if (list[i] !== string && match.test(list[i])) {
                            matchedList.push(list[i]);
                        }
                    }
                    list = matchedList;
                }
            }
        }

        let result = { list: list, from: from, to: to };
        CodeMirror.on(result, 'pick', (completion) => {
            // If is a key autocomplete with de default value
            if (wasKey) {
                // console.log(address+'/'+completion);
                let defaultValue = this.getDefault(address, completion);
                editor.replaceRange(': ' + defaultValue,
                    { line: result.to.line, ch: result.to.ch + completion.length },
                    { line: result.to.line, ch: result.to.ch + completion.length + 1 },
                    'complete');
            }
        });

        return result;
    }

    getDefault (address, completion) {
        let key = {
            address: address + '/' + completion,
            key: completion,
            value: ''
        };
        let defaultValue = '';
        for (let datum of this.valueSuggestions) {
            if (datum.check(key, true)) {
                defaultValue = datum.getDefault();
                break;
            }
        }
        return defaultValue;
    }
}

class Suggestion {
    constructor (datum) {
        //  TODO: must be a better way to do this
        if (datum.address) {
            this.checkAgainst = 'address';
        }
        else if (datum.key) {
            this.checkAgainst = 'key';
        }
        else if (datum.value) {
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

    check (node, forceLevel) {
        if (node && this.checkAgainst) {
            let rightLevel = true;
            if (!forceLevel && this.level) {
                rightLevel = getLineInd(editor, node.pos.line) === this.level;
            }
            return RegExp(this.checkPatern).test(node[this.checkAgainst]) && rightLevel;
        }
        else {
            return false;
        }
    }

    getDefault () {
        return this.defaultValue || '';
    }

    getList (node) {
        let scene = tangramLayer.scene;
        let list = [];
        let presentNodes = [];

        // Add options
        if (this.options) {
            Array.prototype.push.apply(list, this.options);
        }

        // Add sources
        if (this.source) {
            let obj = getAddressSceneContent(scene, this.source);
            let keyFromSource = obj ? Object.keys(obj) : [];
            Array.prototype.push.apply(list, keyFromSource);
        }

        // Take out present keys
        let obj = getAddressSceneContent(scene, node.address);
        presentNodes = obj ? Object.keys(obj) : [];
        for (let j = list.length - 1; j >= 0; j--) {
            if (presentNodes.indexOf(list[j]) > -1) {
                list.splice(j, 1);
            }
        }

        return list;
    }
}
