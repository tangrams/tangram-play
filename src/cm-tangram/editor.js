
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
                    "Tab": function(cm) {
                        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                        cm.replaceSelection(spaces);
                    },
                    "Alt-F" : function(cm) {
                                    var pos = cm.getCursor();
                                    var opts = cm.state.foldGutter.options;
                                    cm.foldCode(pos, opts.rangeFinder);
                                } ,
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
        var updateContet = debounce( function(){
            var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
            var url = createObjectURL(new Blob([ cm.getValue() ]));
            scene.reload(url);

            updateWidgets(cm);
        }, 500);
        updateContet();
    });

    //  When the viewport change (lines are add or erased)
    cm.on("viewportChange", function(cm, from, to){
        updateWidgets(cm);
    });

    // cm.on("mousedown", function(event){
    //     // var cursor = editor.getCursor(true);
    // });

    // cm.on("cursorActivity", function(cm){
    // });
        
    return cm;
}

//  TOOLS
//  ===============================================================================

//  Check if a line is empty
function isStrEmpty(str) { return (!str || 0 === str.length || /^\s*$/.test(str));}
function isEmpty(cm, nLine) { return isStrEmpty( cm.lineInfo(nLine).text ); }

//  Check if the line is commented YAML style 
function isStrCommented(str) { var regex = /^\s*[\#||\/\/]/gm; return (regex.exec( str ) || []).length > 0; }
function isCommented(cm, nLine) { return isStrCommented( cm.lineInfo(nLine).text ); }

//  Get the spaces of a string
function getSpaces(str) {
    var regex = /^(\s+)/gm;
    var space = regex.exec(str);
    if (space)
        return (space[1].match(/\s/g) || []).length;
    else 
        return 0;
}

//  Get the indentation level of a line
function getInd(string) { return getSpaces( string ) / 4;}
function getIndLevel(cm, nLine) { return getSpaces( cm.lineInfo(nLine).text ) / cm.getOption("tabSize"); }

//  Check if a str ends with a suffix
function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1;}

//  Jump to a specific line
function jumpToLine(cm, nLine) { cm.scrollTo( null, cm.charCoords({line: nLine-1, ch: 0}, "local").top ); } 

//  SELECT
//  ===============================================================================

//  Select a line or a range of lines
//
function selectLines(cm, rangeString) {
    var from, to;

    if ( isNumber(rangeString) ) {
        from = parseInt(rangeString)-1;
        to = from; 
    } else {
        var lines = rangeString.split('-');
        from = parseInt(lines[0])-1;
        to = parseInt(lines[1])-1;
    }

    // If folding level is on un fold the lines selected
    if (querry['foldLevel']) {
        foldAllBut(cm, from,to,querry['foldLevel']);
    }
    
    cm.setSelection({ line: from, ch:0},
                    { line: to, ch:cm.lineInfo(to).text.length } );
    jumpToLine(cm,from);
}

//  FOLD
//  ===============================================================================

//  Is posible to fold
//
function isFolder(cm, nLine) {
    if ( cm.lineInfo(nLine).gutterMarkers ){
        return cm.lineInfo(nLine).gutterMarkers['CodeMirror-foldgutter'] !== null;
    } else {
        return false;
    }
}

//  Select everything except for a range of lines
//
function foldAllBut(cm, From, To, querryLevel) {
    // default level is 0
    querryLevel = typeof querryLevel !== 'undefined' ? querryLevel : 0;

    // fold everything
    foldByLevel(cm, querryLevel);

    // get minimum indentation
    var minLevel = 10;
    var startOn = To;
    var onBlock = true;

    for (var i = From-1; i >= 0; i--) {

        var level = getIndLevel(cm, i);

        if (level === 0){
            break;
        }

        if (level < minLevel ){
            minLevel = level;
        } else if (onBlock) {
            startOn = i;
            onBlock = false;
        }
    }

    minLevel = 10;
    for (var i = To; i >= From; i--) {
        var level = getIndLevel(cm, i);
        var chars = cm.lineInfo(i).text.length;
        if (level < minLevel && chars > 0){
            minLevel = level;
        }
    }
    var opts = cm.state.foldGutter.options;

    for (var i = startOn; i >= 0; i--) {
        var level = getIndLevel(cm, i);

        if (level === 0 && cm.lineInfo(i).text.length > 0){
            break;
        }

        if ( level <= minLevel ){
            cm.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }

    for (var i = To; i < cm.lineCount() ; i++) {
        if (getIndLevel(cm, i) >= querryLevel){
            cm.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }
}

//  Unfold all lines
//
function unfoldAll(cm) {
    var opts = cm.state.foldGutter.options;
    for (var i = 0; i < cm.lineCount() ; i++) {
        cm.foldCode({ line: i }, opts.rangeFinder, "unfold");
    }
}

//  Fold all lines above a specific indentation level
//
function foldByLevel(cm, level) {  
    unfoldAll(cm);  
    var opts = cm.state.foldGutter.options;

    var actualLine = cm.getDoc().size-1;
    while ( actualLine >= 0) {
        if ( isFolder(cm, actualLine) ){
            if (getIndLevel(cm, actualLine) >= level){
                cm.foldCode({line:actualLine,ch:0}, opts.rangeFinder);
            }
        }
        actualLine--;
    }
};