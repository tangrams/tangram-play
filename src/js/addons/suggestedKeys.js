'use strict';

import Utils from '../core/common.js';
import YAMLTangram from '../parsers/yaml-tangram.js';
import Widgets from './widgets.js';

module.exports = {
    load,
    suggest
}

function load (cm, configFile) {

    // Initialize array
    if (cm.suggestedKeys) {
        // Clean key list
        while (cm.suggestedKeys.length) {
            cm.suggestedKeys.pop();
        }
    } else {
        cm.suggestedKeys = [];
    }

    // Load Json
    cm.suggestedKeys = JSON.parse(Utils.fetchHTTP(configFile))["keys"];

    //  Initialize tokens
    for (let i = 0; i < cm.suggestedKeys.length; i++) {
        cm.suggestedKeys[i].token = YAMLTangram.addToken(cm.suggestedKeys[i]);
    }
}

//  TODO:
//          -- Replace global scene by a local
//
function suggest (cm) {
    let top = cm.getScrollInfo().top;

    // Erase previus keys
    if (cm.suggestedKeysMenu) {
        cm.suggestedKeysMenu.clear();
        cm.focus();
    }

    // Get line address
    let cursor = cm.getCursor(true);
    let nline = cursor.line;
    let address = YAMLTangram.getKeyAddress(cm,nline);

    let presentKeys = [];

    if (scene) {
        let obj = YAMLTangram.getAddressSceneContent(scene,address);
        presentKeys = obj? Object.keys(obj) : [];
    }

    // Search for matches
    for (let i = 0; i < cm.suggestedKeys.length; i++) {
        if (cm.suggestedKeys[i].token(scene,cm,nline)) {

            let suggestedKeysList = [];

            if (cm.suggestedKeys[i].options) {
                Array.prototype.push.apply(suggestedKeysList, cm.suggestedKeys[i].options);
            }

            if (cm.suggestedKeys[i].source) {
                let obj = YAMLTangram.getAddressSceneContent(scene, cm.suggestedKeys[i].source);
                let keyFromSource = obj? Object.keys(obj) : [];
                Array.prototype.push.apply(suggestedKeysList, keyFromSource);
            }


            for (let j = suggestedKeysList.length-1; j >= 0; j--) {
                if (presentKeys.indexOf(suggestedKeysList[j]) > -1) {
                    suggestedKeysList.splice(j, 1);
                }
            }

            if (suggestedKeysList.length) {
                addList(suggestedKeysList,cm,nline);
            }
            break;
        }
    }

    cm.focus();
    cm.scrollTo(null,top);
}

function addList( suggestedKeysList, cm, nLine ) {
    let options = {
        position: "top"
    }

    if (cm.suggestedKeysMenu) {
        cm.suggestedKeysMenu.clear();
        options.replace = cm.suggestedKeysMenu;
    }

    let node = makeMenu(suggestedKeysList, cm, nLine);

    // Add as a panel on top of codemirror
    // cm.suggestedKeysMenu = cm.addPanel(node, options);

    // Add in line after the cursors position
    cm.suggestedKeysMenu = cm.addLineWidget(nLine, node, {coverGutter: false, noHScroll: true});

    // Update widgets position, because this will displace a new line
    Widgets.update(cm);
}

function makeMenu(suggestedKeysList, cm, nLine) {
    let node = document.createElement("div");
    node.className = "cm-suggested-keys-menu";

    let widget, label;

    let close = node.appendChild(document.createElement("a"));
    close.className =  "cm-suggested-keys-menu-remove";
    close.textContent = "✖";

    cm.on(close, "click", function() {
        cm.suggestedKeysMenu.clear();
    });

    for (let i = 0; i < suggestedKeysList.length; i++) {
        let btn = document.createElement('button');
        let text = document.createTextNode(suggestedKeysList[i]);
        btn.value = nLine;
        btn.className = 'cm-suggested-keys-menu-btn';

        btn.onclick = function() {
            cm.suggestedKeysMenu.clear();

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

            Widgets.update(cm);
        };

        btn.appendChild(text);
        node.appendChild(btn);
    }(cm);

    return node;
}