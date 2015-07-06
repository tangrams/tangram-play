// Load some common functions
import { fetchHTTP, debounce } from '../core/common.js';
import { addToken, getKeyAddress, getAddressSceneContent } from '../core/codemirror/yaml-tangram.js';

export default class SuggestManager {
    constructor (tangram_play, configFile ) {

        this.tangram_play = tangram_play;

        // Load data file
        this.data = JSON.parse(fetchHTTP(configFile))["keys"];
        this.active = [];

        //  Initialize tokens
        for (let i = 0; i < this.data.length; i++) {
            this.data[i].token = addToken(this.data[i]);
        }

        let sm = this;
        var updateKeys = debounce(function(cm) {
            sm.suggest();
        }(sm), 1000);

        this.tangram_play.editor.codemirror.on("cursorActivity", function(cm) {
            updateKeys();
        });
    }

    suggest () {

        let cm = this.tangram_play.editor.codemirror;
        let scene = this.tangram_play.map.scene;

        let top = cm.getScrollInfo().top;

        // Erase previus keys
        if (this.active) {
            // this.active.clear();
            cm.focus();
        }

        // Get line address
        let cursor = cm.getCursor(true);
        let nline = cursor.line;
        let address = getKeyAddress(cm,nline);

        let presentKeys = [];

        if (scene) {
            let obj = getAddressSceneContent(scene ,address);
            presentKeys = obj? Object.keys(obj) : [];
        }

        // Search for matches
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].token( scene,
                                    cm,
                                    nline)) {

                let suggestedKeysList = [];

                if (this.data[i].options) {
                    Array.prototype.push.apply(suggestedKeysList, this.data[i].options);
                }

                if (this.data[i].source) {
                    let obj = getAddressSceneContent(scene , this.data[i].source);
                    let keyFromSource = obj? Object.keys(obj) : [];
                    Array.prototype.push.apply(suggestedKeysList, keyFromSource);
                }


                for (let j = suggestedKeysList.length-1; j >= 0; j--) {
                    if (presentKeys.indexOf(suggestedKeysList[j]) > -1) {
                        suggestedKeysList.splice(j, 1);
                    }
                }

                if (suggestedKeysList.length) {
                    addList(suggestedKeysList,nline);
                }
                break;
            }
        }

        cm.focus();
        cm.scrollTo(null,top);
    };

// private
    addList( suggestedKeysList, nLine ) {
        let options = {
            position: "top"
        }

        if (this.active) {
            this.active.clear();
            options.replace = this.active;
        }

        let node = makeMenu(suggestedKeysList, cm, nLine);

        let cm = this.tangram_play.editor.codemirror;
        // Add as a panel on top of codemirror
        // this.active = cm.addPanel(node, options);

        // Add in line after the cursors position
        this.active = cm.addLineWidget(nLine, node, {coverGutter: false, noHScroll: true});
    };

    makeMenu(suggestedKeysList, nLine) {
        let cm = this.tangram_play.editor.codemirror;
        let active = this.active;

        let node = document.createElement("div");
        node.className = "cm-suggested-keys-menu";

        let widget, label;

        let close = node.appendChild(document.createElement("a"));
        close.className =  "cm-suggested-keys-menu-remove";
        close.textContent = "✖";

        cm.on(close, "click", function() {
            this.active.clear();
        });

        for (let i = 0; i < suggestedKeysList.length; i++) {
            let btn = document.createElement('button');
            let text = document.createTextNode(suggestedKeysList[i]);
            btn.value = nLine;
            btn.className = 'cm-suggested-keys-menu-btn';

            btn.onclick = function() {
                active.clear();

                let tabs = cm.getLineInd(parseInt(this.value) )+1;
                let text = '\n';
                for (let i = 0; i < tabs; i++) {
                    text += Array(cm.getOption("indentUnit") + 1).join(" ");
                }
                text += this.innerText+": ";

                let doc = cm.getDoc();
                let cursor = doc.getCursor();           // gets the line number in the cursor position
                let line = doc.getLine(cursor.line);    // get the line contents
                let pos = {                             // create a new object to avoid mutation of the original selection
                    line: cursor.line,
                    ch: line.length                     // set the character position to the end of the line
                }
                doc.replaceRange(text, pos);            // adds a new line
            };

            btn.appendChild(text);
            node.appendChild(btn);
        }(cm);
        return node;
    };
};