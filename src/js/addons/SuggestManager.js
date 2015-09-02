import TangramPlay from '../TangramPlay.js';

// Load some common functions
import { httpGet, debounce } from '../core/common.js';
import { getLineInd, isEmpty } from '../core/codemirror/tools.js';
import { getAddressSceneContent, getKeyPairs, getValueRange } from '../core/codemirror/yaml-tangram.js';

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
            let suggestionsData = JSON.parse(res)['suggest'];

            // Initialize tokens
            for (let datum of suggestionsData) {
                this.data.push(new KeySuggestion(datum));
            }
        });
    }

    getSuggestions(cursor) {
        let nLine = cursor.line;
        let list = [];

        // What's the main key of the line?
        let keys = getKeyPairs(TangramPlay.editor, nLine);
        if (keys) {
            let key = keys[0];
            
            console.log('GetSuggestion for key',keys);
            if (key && key.value === '') {
                for (let datum of this.data) {
                    if (datum.check(key)) {
                        list.push.apply(list,datum.getList(key));
                    }
                }
            }
        }
        return list;
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
        if (datum.options) {
            this.options = datum.options;
        }

        if (datum.source) {
            this.source = datum.source;
        }
    }

    check(keyPair) {
        if (keyPair && this.checkAgainst) {
            return RegExp(this.checkPatern).test(keyPair[this.checkAgainst]);
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
