// Load some common functions
import { fetchHTTP, debounce } from '../core/common.js';
import { getLineInd, isEmpty } from '../core/codemirror/tools.js';
import { getAddressSceneContent, getValueRange } from '../core/codemirror/yaml-tangram.js';

// Debounced event after user stop doing something
var stopAction = debounce(function(cm) {
    let line = editor.getCursor().line;
    cm.suggestManager.suggest(line);
}, 1000);

export default class SuggestManager {
    constructor(tangramPlay, configFile) {
        //  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangramPlay.editor.suggestManager = this;

        //  private variables
        this.tangramPlay = tangramPlay;
        this.data = [];
        this.active = undefined;

        //  Load data file
        let suggestionsData = JSON.parse(fetchHTTP(configFile))['suggest'];

        // Initialize tokens
        for (let datum of suggestionsData) {
            this.data.push(new Suggestion(this, datum));
        }

        // Suggestions are trigged by the folowing CM events
        this.tangramPlay.editor.on('cursorActivity', function(cm) {
            stopAction(cm);
        });
    }

    suggest (nLine) {
        this.clear();
        let top = this.tangramPlay.editor.getScrollInfo().top;

        // What's the main key of the line?
        let keys = this.tangramPlay.getKeysOnLine(nLine);
        if (keys) {
            let key = keys[0];
            if (key && key.value === '') {
                for (let datum of this.data) {
                    if (datum.check(key)) {
                        datum.make(this.tangramPlay, key);
                    }
                }
            }
            else {
                return;
            }
        }
        else {
            return;
        }

        this.tangramPlay.editor.focus();
        this.tangramPlay.editor.scrollTo(null, top);
    };

    clear() {
        // Erase previus keys
        if (this.active) {
            this.active.clear();
            this.active = undefined;
            this.tangramPlay.editor.focus();
        }
    }
};

class Suggestion {
    constructor(manager, datum) {
        this.manager = manager;

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

    clear() {
        if (this.dom && this.dom.parentNode) {
            this.dom.parentNode.removeChild(this.dom);
            this.dom = undefined;
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

    make(tp, keyPair) {
        let scene = tp.scene;
        let cm = tp.editor;
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

        if (list.length) {
            // this.addList(list,nline);
            let options = { position: 'top' };

            // If there is a previus suggestion take it out
            if (this.manager.active) {
                this.manager.active.clear();
                options.replace = this.manager.active;
            }

            this.dom = makeMenu(cm, keyPair.pos.line, list);

            // Add as a panel on top of codemirror
            // this.manager.active = cm.addPanel(dom, options);

            cm.addWidget(getValueRange(keyPair).to, this.dom);
            this.manager.active = this;
        }
    }
};

function makeMenu(cm, nLine, list) {
    let node = document.createElement('div');
    node.className = 'tangram-play-suggested-menu';

    for (let i = 0; i < list.length; i++) {
        let btn = document.createElement('button'),
            text = document.createTextNode(list[i] + ': ');
        cm.suggestManager.activeLine = nLine;
        btn.className = 'tangram-play-suggested-menu-btn';

        btn.onclick = function() {
            if (cm.suggestManager.active) {
                cm.suggestManager.active.clear();
            }
            let tabs = getLineInd(cm, cm.suggestManager.activeLine) + 1;
            let textToAdd = '';

            if (isEmpty(cm, cm.getCursor().line)) {
                tabs -= getLineInd(cm, cm.getCursor().line);
            }
            else {
                textToAdd += '\n';
            }

            for (let i = 0; i < tabs; i++) {
                textToAdd += Array(cm.getOption('indentUnit') + 1).join(' ');
            }

            textToAdd += list[i] + ': ';

            let doc = cm.getDoc();
            let cursor = doc.getCursor(); // gets the line number in the cursor position
            let line = doc.getLine(cursor.line); // get the line contents

            // create a new object to avoid mutation of the original selection
            let pos = { line: cursor.line, ch: line.length }; // set the character position to the end of the line

            doc.replaceRange(textToAdd, pos); // adds a new line
        };

        btn.appendChild(text);
        node.appendChild(btn);
    }
    return node;
}
