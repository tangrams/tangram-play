import TangramPlay from 'app/TangramPlay';

// Load some common functions
import { httpGet } from 'app/core/common';
import { getText, getLineInd } from 'app/core/codemirror/tools';
import { getAddressSceneContent, getKeyPairs, getAddressForLevel } from 'app/core/codemirror/yaml-tangram';

// Import CodeMirror
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';

export default class SuggestManager {
    constructor(configFile) {
        //  private variables
        this.keySuggestions = [];
        this.valueSuggestions = [];
        this.active = undefined;

        //  Load data file
        httpGet(configFile, (err, res) => {
            let keys = JSON.parse(res)['keys'];

            // Initialize tokens
            for (let datum of keys) {
                this.keySuggestions.push(new Suggestion(datum));
            }

            let values = JSON.parse(res)['values'];

            // Initialize tokens
            for (let datum of values) {
                this.valueSuggestions.push(new Suggestion(datum));
            }
        });

        // Trigger hint after each time the style is uploaded
        TangramPlay.on('style_updated', (args) => {
            let bOpen = true;

            let line = TangramPlay.editor.getCursor().line;
            if (TangramPlay.editor.getLineHandle(line).stateAfter &&
                TangramPlay.editor.getLineHandle(line).stateAfter.localMode &&
                TangramPlay.editor.getLineHandle(line).stateAfter.localMode.helperType) {
                if (TangramPlay.editor.getLineHandle(line).stateAfter.localMode.helperType === "glsl" ||
                    TangramPlay.editor.getLineHandle(line).stateAfter.localMode.helperType === "javascript") {
                    bOpen = false;
                }
            }

            if (bOpen && TangramPlay.editor.showHint) {
                TangramPlay.editor.showHint({
                    completeSingle: false,
                    customKeys: {
                        Tab: function(cm, handle) {
                            cm.replaceSelection(Array(cm.getOption('indentUnit') + 1).join(' '));
                        },
                        Up: function(cm, handle) {
                            handle.moveFocus(-1);
                        },
                        Down: function(cm, handle) {
                            handle.moveFocus(1);
                        },
                        PageUp: function(cm, handle) {
                            handle.moveFocus(-handle.menuSize() + 1, true);
                        },
                        PageDown: function(cm, handle) {
                            handle.moveFocus(handle.menuSize() - 1, true);
                        },
                        Home: function(cm, handle) {
                            handle.setFocus(0);
                        },
                        End: function(cm, handle) {
                            handle.setFocus(handle.length - 1);
                        },
                        Enter: function(cm, handle) {
                            handle.pick();
                        },
                        Esc: function(cm, handle) {
                            handle.close();
                        }
                    }
                });
            }
        });
    }

    hint(editor, options) {
        let cursor = editor.getCursor();
        let nLine = cursor.line;

        let list = [];
        let start = cursor.ch;
        let end = cursor.ch + 1;

        // What's the main key of the line?
        let keyPairs = getKeyPairs(editor, nLine);
        if (keyPairs) {
            let keyPair = keyPairs[0];

            if (keyPair) {
                if (keyPair.key === '') {
                    // Fallback the address to match
                    let actualLevel = getLineInd(editor, nLine);
                    let newAddress = getAddressForLevel(keyPair.address, actualLevel);
                    keyPair.address = newAddress;
                    // Suggest keyPair
                    for (let datum of this.keySuggestions) {
                        if (datum.check(keyPair)) {
                            list.push.apply(list, datum.getList(keyPair));
                        }
                    }

                    let string = getText(editor, nLine);
                    if (string !== '') {
                        let matchedList = [];
                        let match = RegExp('^' + string + '.*');
                        for (let i = 0; i < list.length; i++) {
                            if (match.test(list[i])) {
                                matchedList.push(list[i] + ': ');
                            }
                        }
                        list = matchedList;
                        start -= string.length;
                    }
                    else {
                        for (let i = 0; i < list.length; i++) {
                            list[i] += ': ';
                        }
                    }
                }
                // else if (keyPair.value === '') {
                else {
                    // Check for widgets
                    for (let datum of this.valueSuggestions) {
                        if (datum.check(keyPair)) {
                            list.push.apply(list, datum.getList(keyPair));
                            break;
                        }
                    }
                    let string = keyPair.value;
                    if (string !== '') {
                        let matchedList = [];
                        let match = RegExp('^' + string + '.*');
                        for (let i = 0; i < list.length; i++) {
                            if (match.test(list[i])) {
                                matchedList.push(list[i]);
                            }
                        }
                        list = matchedList;
                        start -= string.length;
                    }
                }
            }
        }

        return {
                list: list,
                from: CodeMirror.Pos(nLine, start),
                to: CodeMirror.Pos(nLine, end)
            };
    }
}

class Suggestion {
    constructor(datum) {
        //  TODO: must be a better way to do this
        if (datum['address']) {
            this.checkAgainst = 'address';
        }
        else if (datum['key']) {
            this.checkAgainst = 'key';
        }
        else if (datum['value']) {
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
    }

    check(keyPair) {
        if (keyPair && this.checkAgainst) {
            let rightLevel = true;
            if (this.level) {
                rightLevel = getLineInd(TangramPlay.editor, keyPair.pos.line) === this.level;
            }
            return RegExp(this.checkPatern).test(keyPair[this.checkAgainst]) && rightLevel;
        }
        else {
            return false;
        }
    }

    getList(keyPair) {
        let scene = TangramPlay.map.scene;
        let list = [];
        let presentKeys = [];

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
        let obj = getAddressSceneContent(scene, keyPair.address);
        presentKeys = obj ? Object.keys(obj) : [];
        for (let j = list.length - 1; j >= 0; j--) {
            if (presentKeys.indexOf(list[j]) > -1) {
                list.splice(j, 1);
            }
        }

        return list;
    }
}
