function loadKeys(cm, configFile ){

    // Initialize array
    if (cm.keys){
        // Clean key list
        while(cm.keys.length > 0) {
            cm.keys.pop();
        }
    } else {
        cm.keys = [];
    }

    // Load Json
    cm.keys = JSON.parse(fetchHTTP(configFile))["keys"];

    //  Initialize tokens
    for (var i = 0; i < cm.keys.length; i++){
        cm.keys[i].token = addToken(cm.keys[i]);
    }
}

//  TODO:
//          -- Replace global scene by a local
//
function suggestKeys(cm){
    var top = cm.getScrollInfo().top;

    // Erase previus keys
    if (cm.keyPanel){
        cm.keyPanel.clear();
        cm.focus();
    }
    
    // Get line address
    cursor = cm.getCursor(true);
    var nline = cursor.line;
    var address = getTagAddress(cm,nline);

    var presentKeys = [];

    if (scene){
        var obj = getAddressSceneContent(scene,address);
        presentKeys = obj? Object.keys(obj) : [];
    }
    
    // Search for matches
    for (var i = 0; i < cm.keys.length; i++){
        if ( cm.keys[i].token(scene,cm,nline) ){

            var suggestedKeys = [];

            if (cm.keys[i].options){
                Array.prototype.push.apply(suggestedKeys, cm.keys[i].options);
            }

            if (cm.keys[i].source){
                var obj = getAddressSceneContent(scene, cm.keys[i].source);
                var keyFromSource = obj? Object.keys(obj) : [];
                Array.prototype.push.apply(suggestedKeys, keyFromSource);
            }


            for (var j = suggestedKeys.length-1; j >= 0; j--){
                if ( presentKeys.indexOf(suggestedKeys[j]) > -1 ){
                    suggestedKeys.splice(j, 1);
                }
            }

            if ( suggestedKeys.length > 0 ) {
                addKeyPanel(suggestedKeys,cm,nline);
            }
            break;
        }
    }

    cm.focus();
    cm.scrollTo(null,top);
}

function addKeyPanel( suggestedKeys, cm, nLine ) {
    var options = { 
        position: "top" 
    }

    if ( cm.keyPanel ){
        cm.keyPanel.clear();
        options.replace = cm.keyPanel;
    }

    var node = makeKeyPanel( suggestedKeys, nLine  );
    cm.keyPanel = cm.addPanel( node, options );
}

function makeKeyPanel( suggestedKeys, nLine ) {
    var node = document.createElement("div");
    node.className = "cm-panel";

    var widget, label;

    var close = node.appendChild(document.createElement("a"));
    close.className =  "cm-panel-remove";
    close.textContent = "✖";

    CodeMirror.on(close, "click", function() {
        cm.keyPanel.clear();
    });

    for (var i = 0; i < suggestedKeys.length; i++){
        var btn = document.createElement("button");
        btn.value = nLine;
        btn.innerText = suggestedKeys[i];
        btn.className = "cm-panel-btn";
        btn.setAttribute('onclick','addKey(this)');
        node.appendChild(btn);   
    }

    return node;
}

//  TODO:
//          -- Replace global editor by local
//
function addKey(div){
    editor.keyPanel.clear();
    
    var tabs = getLineInd( editor, parseInt(div.value) )+1;
    var text = '\n';
    for(var i = 0; i < tabs; i++){
        text += Array(editor.getOption("indentUnit") + 1).join(" ") ;
    }
    text += div.innerText+": ";

    var doc = editor.getDoc();
    var cursor = doc.getCursor();           // gets the line number in the cursor position
    var line = doc.getLine(cursor.line);    // get the line contents
    var pos = {                             // create a new object to avoid mutation of the original selection
        line: cursor.line,
        ch: line.length                     // set the character position to the end of the line
    }
    doc.replaceRange(text, pos);            // adds a new line

    updateWidgets(editor);
}