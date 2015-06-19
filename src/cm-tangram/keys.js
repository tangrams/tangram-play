var keys = [];
var keyPanel;

function loadKeys( configFile ){
    keys = JSON.parse(fetchHTTP(configFile))["keys"];

    for (var i = 0; i < keys.length; i++){
        keys[i].token = addToken(keys[i]);
    }
}

function suggestKeys(cm){
    cursor = cm.getCursor(true);
    var nline = cursor.line;
    var address = getTagAddress(cm,nline);

    // Chech for Colors
    for (var i = 0; i < keys.length; i++){
        if ( keys[i].token(scene,cm,nline) ){
            console.log(keys[i].options);
            addKeyPanel(keys[i].options,cm,nline);
            break;
        }
    }
}

function makeKeyPanel( keys, cm, nLine ) {
    var node = document.createElement("div");
    node.className = "cm-panel";

    var widget, label;

    var close = node.appendChild(document.createElement("a"));
    close.className =  "cm-panel-remove";
    close.textContent = "✖";

    CodeMirror.on(close, "click", function() {
        keyPanel.clear();
    });

    for (var i = 0; i < keys.length; i++){
        var btn = document.createElement("button");
        btn.value = nLine;
        btn.innerText = keys[i];
        btn.className = "cm-panel-btn";
        btn.setAttribute('onclick','addKey(this)');
        node.appendChild(btn);
    }

    return node;
}

function addKeyPanel( keys, cm, nLine ) {
    var options = { 
        position: "top" 
    }

    if ( keyPanel ){
        keyPanel.clear();
        options.replace = keyPanel;
    }

    var node = makeKeyPanel( keys, cm, nLine  );
    keyPanel = editor.addPanel( node, options );
}

function addKey(div){
    keyPanel.clear();
    
    var tabs = getLineInd( editor, parseInt(div.value) )+1;
    var text = '\n';
    for(var i = 0; i < tabs; i++){
        text += Array(editor.getOption("indentUnit") + 1).join(" ") ;
    }
    text += div.innerText+":";

    var doc = editor.getDoc();
    var cursor = doc.getCursor();           // gets the line number in the cursor position
    var line = doc.getLine(cursor.line);    // get the line contents
    var pos = {                             // create a new object to avoid mutation of the original selection
        line: cursor.line,
        ch: line.length                  // set the character position to the end of the line
    }
    doc.replaceRange(text, pos);            // adds a new line
}