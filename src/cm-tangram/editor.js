var updateContet = debounce(function(cm){
    var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
    var url = createObjectURL(new Blob([ cm.getValue() ]));
    scene.reload(url);

    updateWidgets(cm);
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
        value: fetchHTTP(style_file),
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
        updateContet(cm);
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
        
    return cm;
}
