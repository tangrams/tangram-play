import { isNumber } from '../common.js';

//  GET Functions
//  ===============================================================================

//  Get the spaces of a string
export function getSpaces(str) {
    let regex = /^(\s+)/gm;
    let space = regex.exec(str);
    if (space)
        return (space[1].match(/\s/g) || []).length;
    else
        return 0;
};

//  Get the indentation level of a line
export function getInd(string) { return getSpaces(string) / 4;};
export function getLineInd(cm, nLine) { return getSpaces(cm.lineInfo(nLine).text) / cm.getOption("tabSize"); };


//  Check if a line is empty
export function isStrEmpty(str) { return (!str || str.length === 0 || /^(\s)*$/.test(str)); };
export function isEmpty(cm, nLine) { return isStrEmpty(cm.lineInfo(nLine).text); };

//  Check if the line is commented YAML style
export function isStrCommented(str) { var regex = /^\s*[\#||\/\/]/gm; return (regex.exec(str) || []).length > 0; };
export function isCommented(cm, nLine) { return isStrCommented(cm.lineInfo(nLine).text); };

//  Get value of a key pair
export function getValue(cm, nLine) {
    let value = /^\s*\w+:\s*([\w|\W|\s]+)$/gm.exec( cm.lineInfo(nLine).text );
    return value ? value[1] : "" ;
};

//  Common NAVIGATION functions on CM
//  ===============================================================================

//  Jump to a specific line
export function jumpToLine(cm, nLine) { cm.scrollTo( null, cm.charCoords({line: nLine-1, ch: 0}, "local").top ); };

//  Jump to a specific line
export function jumpToLineAt(cm, nLine, offset) {
    var t = cm.charCoords({line: nLine-1, ch: 0}, "local").top;
    cm.scrollTo(null, t);
};

//  Common SELECTION function on CM
//  ===============================================================================

//  Select a line or a range of lines
//
export function selectLines(cm, rangeString) {
    var from, to;

    if (isNumber(rangeString)) {
        from = parseInt(rangeString)-1;
        to = from;
    } else {
        var lines = rangeString.split('-');
        from = parseInt(lines[0])-1;
        to = parseInt(lines[1])-1;
    }

    // If folding level is on un fold the lines selected
    if (query['foldLevel']) {
        foldAllBut(cm, from,to,query['foldLevel']);
    }

    cm.setSelection({ line: from, ch:0},
                    { line: to, ch: cm.getLine(to).length } );
    
    jumpToLine(cm,from);
};

//  Common FOLD functions on CM
//  ===============================================================================

//  Is posible to fold
//
export function isFolder(cm, nLine) {
    if ( cm.lineInfo(nLine).gutterMarkers ) {
        return cm.lineInfo(nLine).gutterMarkers['CodeMirror-foldgutter'] !== null;
    } else {
        return false;
    }
};

//  Select everything except for a range of lines
//
export function foldAllBut(cm, From, To, queryLevel) {
    // default level is 0
    queryLevel = typeof queryLevel !== 'undefined' ? queryLevel : 0;

    // fold everything
    foldByLevel(cm, queryLevel);

    // get minimum indentation
    var minLevel = 10;
    var startOn = To;
    var onBlock = true;

    for (var i = From-1; i >= 0; i--) {

        var level = getLineInd(cm, i);

        if (level === 0) {
            break;
        }

        if (level < minLevel) {
            minLevel = level;
        } else if (onBlock) {
            startOn = i;
            onBlock = false;
        }
    }

    minLevel = 10;
    for (var i = To; i >= From; i--) {
        var level = getLineInd(cm, i);
        var chars = cm.lineInfo(i).text.length;
        if (level < minLevel && chars > 0) {
            minLevel = level;
        }
    }
    var opts = cm.state.foldGutter.options;

    for (var i = startOn; i >= 0; i--) {
        var level = getLineInd(cm, i);

        if (level === 0 && cm.lineInfo(i).text.length) {
            break;
        }

        if (level <= minLevel) {
            cm.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }

    for (var i = To; i < cm.lineCount() ; i++) {
        if (getLineInd(cm, i) >= queryLevel) {
            cm.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }
};

//  Unfold all lines
//
export function unfoldAll(cm) {
    var opts = cm.state.foldGutter.options;
    for (var i = 0; i < cm.lineCount() ; i++) {
        cm.foldCode({ line: i }, opts.rangeFinder, "unfold");
    }
};

//  Fold all lines above a specific indentation level
//
export function foldByLevel(cm, level) {
    unfoldAll(cm);
    var opts = cm.state.foldGutter.options;

    var actualLine = cm.getDoc().size-1;
    while (actualLine >= 0) {
        if (isFolder(cm, actualLine)) {
            if (getLineInd(cm, actualLine) >= level) {
                cm.foldCode({line:actualLine,ch:0}, opts.rangeFinder);
            }
        }
        actualLine--;
    }
};
