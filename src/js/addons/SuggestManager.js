import TangramPlay from '../TangramPlay.js';

// Load some common functions
import { httpGet } from '../core/common.js';
import { getText, getLineInd } from '../core/codemirror/tools.js';
import { getAddressSceneContent, getKeyPairs } from '../core/codemirror/yaml-tangram.js';

// Import CodeMirror
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';

export default class SuggestManager {
    constructor(configFile) {
        //  private variables
        this.data = [];
        this.active = undefined;

        //  Load data file
        httpGet(configFile, (err, res) => {
            let suggestionsData = JSON.parse(res)['keys'];

            // Initialize tokens
            for (let datum of suggestionsData) {
                this.data.push(new KeySuggestion(datum));
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
        let keyPairs = getKeyPairs(TangramPlay.editor, nLine);
        if (keyPairs) {
            let keyPair = keyPairs[0];

            if (keyPair) {
                if (keyPair.key === '') {
                    // Suggest keyPair
                    for (let datum of this.data) {
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
                else {
                    console.log('Suggest Value');
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

class KeySuggestion {
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
            if (this.keyLevel) {
                rightLevel = getLineInd(TangramPlay.editor, keyPair.pos.line) === this.keyLevel;
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
