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
function getIndLevel(cm, nLine) { return getSpaces( cm.lineInfo(nLine).text ) / cm.getOption("tabSize"); }

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
