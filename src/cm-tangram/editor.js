//  TODO:
//          -- Replace global scene by a local
//
var updateContent = debounce(function(cm){
    var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity

    //  If doesn't have a API key 
    //  inject a Tangram-Play one: vector-tiles-x4i7gmA ( Patricio is the owner )
    var content = cm.getValue();
    var pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
    var result = "$1??api_key=vector-tiles-x4i7gmA"
    content = content.replace(pattern, result);

    if (scene) {
        var url = createObjectURL(new Blob([content]));
        scene.reload(url);
        updateWidgets(cm);
    }
    
}, 500);

var updateKeys = debounce(function(cm){
    suggestKeys(cm);
}, 1000);

//  Initialize the editor in a specific DOM and with the context of a style_file
//
function initEditor( dom, style_file ){

    var rulers = [];
    for (var i = 1; i < 10; i++) {
        var b = Math.round((0.88 + i/90)*255);
        rulers.push({   color: 'rgb('+b+','+b+','+b+')',
                        column: i * 4,
                        lineStyle: "dashed"});
    }

    var cm = CodeMirror( dom ,{
        value: "Loading...",
        rulers: rulers,
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/x-yaml-tangram",
        keyMap: "sublime",
        autoCloseBrackets: true,
        extraKeys: {"Ctrl-Space": "autocomplete",
                    "Tab": function(cm) { cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" ")); },
                    "Alt-F" : function(cm) { cm.foldCode(cm.getCursor(), cm.state.foldGutter.options.rangeFinder); } ,
                    "Alt-P" : function(cm) {takeScreenshot();},
                    "Ctrl-0" : function(cm){unfoldAll(cm)},
                    "Ctrl-1" : function(cm){foldByLevel(cm,0)},
                    "Ctrl-2" : function(cm){foldByLevel(cm,1)},
                    "Ctrl-3" : function(cm){foldByLevel(cm,2)},
                    "Ctrl-4" : function(cm){foldByLevel(cm,3)},
                    "Ctrl-5" : function(cm){foldByLevel(cm,4)},
                    "Ctrl-6" : function(cm){foldByLevel(cm,5)},
                    "Ctrl-7" : function(cm){foldByLevel(cm,6)},
                    "Ctrl-8" : function(cm){foldByLevel(cm,7)}
        },
        foldGutter: {
            rangeFinder: CodeMirror.fold.indent
        },
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        showCursorWhenSelecting: true,
        theme: "tangram",
        lineWrapping: true,
        autofocus: true,
        indentUnit: 4
    });

    //  Hook events

    //  Update Tangram Map when stop typing
    cm.on("change", function(cm){
        if(cm.isSaved){
            cm.isSaved = false;
        }
        updateContent(cm);
    });

    //  When the viewport change (lines are add or erased)
    cm.on("viewportChange", function(cm, from, to){
        updateWidgets(cm);
    });

    // cm.on("mousedown", function(event){
    //     // var cursor = editor.getCursor(true);
    // });

    cm.on("cursorActivity", function(cm){
        updateKeys(cm);
    });

    loadStyle(cm, fetchHTTP(style_file));

    return cm;
}

function loadStyle(cm, contents){
    if (contents){

        contents = contents.replace(/\?api_key\=(\w|\-)*$/gm,"");
        
        //  Delete API Key
        cm.setValue(contents);
        cm.isSaved = true;

        // TODO:
        //      - instead of deleting the key if should check if 
        //      this user owns the key. If it doesn't delete it

    }
}

function getContent(cm){
    return cm.getValue();
}
