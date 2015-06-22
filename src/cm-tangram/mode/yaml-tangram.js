//  SET Functions
//  ===============================================================================
function setValue(cm, nLine, string){
    var line = cm.lineInfo(nLine).text;
    var tag = /^\s*(\w+):\s*/gm.exec( line );
    if (tag){
        cm.replaceRange(string, {line: nLine, ch:tag[0].length}, {line: nLine, ch:line.length});
    }
}

//  GET Functions
//  ===============================================================================

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
function getLineInd(cm, nLine) { return getSpaces( cm.lineInfo(nLine).text ) / cm.getOption("tabSize"); }

function getTag(cm, nLine){
    var tag = /^\s*([\w|\-|\_]+):/gm.exec( cm.lineInfo(nLine).text );
    return tag ? tag[1] : "" ;
}

// Get array of YAML tags parent tree of a particular line
function getTags(cm, nLine) { return cm.lineInfo(nLine).handle.stateAfter.yamlState.tags; }
// Get string of YAML tags in a folder style
function getTagAddress(cm, nLine) { 
    if (cm.lineInfo(nLine).handle.stateAfter &&
        cm.lineInfo(nLine).handle.stateAfter.yamlState && 
        cm.lineInfo(nLine).handle.stateAfter.yamlState.tagAddress ){
        return cm.lineInfo(nLine).handle.stateAfter.yamlState.tagAddress;
    } else {
        return "/";
    }
}

//  Get value of a key pair 
function getValue(cm, nLine){
    var value = /^\s*\w+:\s*([\w|\W|\s]+)$/gm.exec( cm.lineInfo(nLine).text );
    return value ? value[1] : "" ;
}

// Get the YAML content a specific series of tags (array of strings)
function getTagSceneContent(scene, cm, nLine){
    var tags = getTags(cm, nLine);
    var tmp = scene.config[ tags[0] ];
    for (var i = 1; i < tags.length; i++){
        if (tmp[ tags[i] ]){
            tmp = tmp[ tags[i] ];
        } else {
            return tmp;
        }
    }
    return tmp;
}

function getAddressSceneContent(scene, address){
    if (scene && scene.config){
        var tags = address.split("/");
        tags.shift();
        if (tags && tags.length > 0){
            var content = scene.config[ tags[0] ];
            for (var i = 1; i < tags.length; i++){
                if (content[ tags[i] ]){
                    content = content[ tags[i] ];
                } else {
                    return content;
                }
            }
            return content;
        } else {
            return "";
        }
    } else {
        return "";
    }
    
}

//  CHECK
//  ===============================================================================

//  Check if a line is empty
function isStrEmpty(str) { return (!str || 0 === str.length || /^\s*$/.test(str));}
function isEmpty(cm, nLine) { return isStrEmpty( cm.lineInfo(nLine).text ); }

//  Check if the line is commented YAML style 
function isStrCommented(str) { var regex = /^\s*[\#||\/\/]/gm; return (regex.exec( str ) || []).length > 0; }
function isCommented(cm, nLine) { return isStrCommented( cm.lineInfo(nLine).text ); }

//  Function that check if a line is inside a Color Shader Block
function isGlobalBlock(address) { return endsWith(address,"shaders/blocks/global"); }
function isWidthBlock(address) { return endsWith(address,"shaders/blocks/width"); }
function isPositionBlock(address) { return endsWith(address,"shaders/blocks/position"); }
function isNormalBlock(address) { return endsWith(address,"shaders/blocks/normal"); }
function isColorBlock(address) { return endsWith(address,"shaders/blocks/color"); }
function isFilterBlock(address) { return endsWith(address,"shaders/blocks/filter"); }
function isShader(address){ return (isGlobalBlock(address) || isWidthBlock(address)  || isPositionBlock(address) || isNormalBlock(address) || isColorBlock(address) || isFilterBlock(address));}

function isContentJS(scene, address) {
    if ( scene && scene.config ){
        return /\s*[\|]*\s*function\s*\(\s*\)\s*\{/gm.test(getAddressSceneContent(scene, address));
    } else {
        return false;
    }
}

function isAfterTag(str,pos){
    var tag = /^\s*(\w+):/gm.exec(str);
    if (tag === undefined){
        return true;
    } else {
        return [0].length < pos;
    }
}

//  CONVERT
//  ===============================================================================

// Make an folder style address from an array of tags
function tags2Address(tags){
    if (tags){
         var address = "";
        for ( var i = 0; i < tags.length; i++){
            address += "/" + tags[i] ;
        }
        return address;
    } else {
        return "/"
    }
}

//  NAVIGATION
//  ===============================================================================

//  Jump to a specific line
function jumpToLine(cm, nLine) { cm.scrollTo( null, cm.charCoords({line: nLine-1, ch: 0}, "local").top ); } 

//  Jump to a specific line
function jumpToLineAt(cm, nLine, offset) { 
    var t = cm.charCoords({line: nLine-1, ch: 0}, "local").top;
    cm.scrollTo( null, t ); 
} 

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

        var level = getLineInd(cm, i);

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
        var level = getLineInd(cm, i);
        var chars = cm.lineInfo(i).text.length;
        if (level < minLevel && chars > 0){
            minLevel = level;
        }
    }
    var opts = cm.state.foldGutter.options;

    for (var i = startOn; i >= 0; i--) {
        var level = getLineInd(cm, i);

        if (level === 0 && cm.lineInfo(i).text.length > 0){
            break;
        }

        if ( level <= minLevel ){
            cm.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }

    for (var i = To; i < cm.lineCount() ; i++) {
        if (getLineInd(cm, i) >= querryLevel){
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
            if (getLineInd(cm, actualLine) >= level){
                cm.foldCode({line:actualLine,ch:0}, opts.rangeFinder);
            }
        }
        actualLine--;
    }
};

//  YAML
//  ===============================================================================

// Add Address to token states
function yamlAddressing(stream, state) {
    // if (!state.tags) state.tags = [];
    // if(state.tagLevel !== undefined) state.tagLevel = -1;

    // Once per line compute the TAGS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        var regex = /(^\s*)([\w|\-|\_]+):/gm;
        var tag = regex.exec(stream.string);
        if ( tag ){

            //  If looks like a tag
            //  Calculate the number of spaces and indentation level
            var spaces = (tag[1].match(/\s/g) || []).length
            var level = Math.floor( spaces  / stream.tabSize );

            //  Update the TAGS tree
            if ( level > state.tagLevel ) {
                state.tags.push(tag[2]);
            } else if (level === state.tagLevel ) {
                state.tags[level] = tag[2];
            } if ( level < state.tagLevel ) {
                var diff = state.tagLevel - level; 
                for (var i = 0; i < diff; i++){
                    state.tags.pop();
                }
                state.tags[level] = tag[2];
            }

            //  Record all that in the state value
            state.tagName = tag[2];
            state.tagLevel = level;
            state.tagAddress = tags2Address(state.tags);
        }
    }
}

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("src/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["src/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("yaml", function(config, parserConfig) {
        var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
        var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

        return {
            token: function(stream, state) {

                var ch = stream.peek();
                var esc = state.escaped;
                state.escaped = false;

                /* comments */
                if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
                    stream.skipToEnd();
                    return "comment";
                }

                if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)){
                    return "string";
                }

                if (state.literal && stream.indentation() > state.keyCol) {
                    stream.skipToEnd(); 
                    return "string";
                } else if (state.literal) { 
                    state.literal = false; 
                }

                if (stream.sol()) {
                    state.keyCol = 0;
                    state.pair = false;
                    state.pairStart = false;
                
                    /* document start */
                    if(stream.match(/---/)) { 
                        return "def";
                    }

                    /* document end */
                    if (stream.match(/\.\.\./)) { 
                        return "def"; 
                    }

                    /* array list item */
                    if (stream.match(/\s*-\s+/)) { 
                        return 'meta'; 
                    }
                }

                /* inline pairs/lists */
                if (stream.match(/^(\{|\}|\[|\])/)) {
                    if (ch == '{')
                        state.inlinePairs++;
                    else if (ch == '}')
                        state.inlinePairs--;
                    else if (ch == '[')
                        state.inlineList++;
                    else
                        state.inlineList--;
                    return 'meta';
                }

                /* list seperator */
                if (state.inlineList > 0 && !esc && ch == ',') {
                    stream.next();
                    return 'meta';
                }

                /* pairs seperator */
                if (state.inlinePairs > 0 && !esc && ch == ',') {
                    state.keyCol = 0;
                    state.pair = false;
                    state.pairStart = false;
                    stream.next();
                    return 'meta';
                }

                /* start of value of a pair */
                if (state.pairStart) {
                    /* block literals */
                    if (stream.match(/^\s*(\||\>)\s*/)) { 
                        state.literal = true; 
                        return 'meta';
                    };

                    /* references */
                    if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) { 
                        return 'variable-2'; 
                    }

                    /* numbers */
                    if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) { 
                        return 'number';
                    }

                    if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) { 
                        return 'number'; 
                    }

                    /* keywords */
                    if (stream.match(keywordRegex)) { 
                        return 'keyword'; 
                    }
                }

                /* pairs (associative arrays) -> key */
                if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
                    state.pair = true;
                    state.keyCol = stream.indentation();
                    return "atom";
                }

                if (state.pair && stream.match(/^:\s*/)) { 
                    state.pairStart = true; return 'meta'; 
                }

                /* nothing found, continue */
                state.pairStart = false;
                state.escaped = (ch == '\\');
                stream.next();
                return null;
            },
            startState: function() {
                return {
                    pair: false,
                    pairStart: false,
                    keyCol: 0,
                    inlinePairs: 0,
                    inlineList: 0,
                    literal: false,
                    escaped: false
                };
            },
            lineComment: "#"
        };
    });

    function words(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    var keywords = "cameras lights scene sources styles layers " +
                    "type url draw data background " +
                    "direction position origin diffuse ambient specular emission radius " +
                    "source texcoords base material lighting animated mix " +
                    "shaders uniforms blocks global position normal color filter " +
                    "order color layer width outline lines polygons " +
                    "fill stroke typeface text font name extrude visible";

    CodeMirror.registerHelper("hintWords", "yaml", keywords.split(" ") );
    CodeMirror.defineMIME("text/x-yaml", { name: "yaml",
                                           keywords: words(keywords) });

});

//  YAML-TANGRAM
//  ===============================================================================
(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("src/codemirror"), require("src/cm-tangram/mode/glsl", require("src/codemirror/mode/javascript")));
    else if (typeof define == "function" && define.amd) // AMD
        define(["src/codemirror", "src/cm-tangram/mode/glsl", "src/codemirror/mode/javascript" ], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("yaml-tangram", function(config, parserConfig) {
        var yamlMode = CodeMirror.getMode(config, "yaml");
        var glslMode = CodeMirror.getMode(config, "glsl");
        var jsMode = CodeMirror.getMode(config, "javascript");

        function yaml(stream, state) {
            var address = state.yamlState.tagAddress;
            if ( address !== undefined){

                var tag = /^\s+(\w*)\:\s+\|/gm.exec(stream.string);
                tag = tag ? tag[1] : "";

                if ( isShader(address) && 
                     !/^\|$/g.test(stream.string) && 
                     isAfterTag(stream.string,stream.pos)) {
                    state.token = glsl;
                    state.localMode = glslMode;
                    state.localState = glslMode.startState( getInd(stream.string) );
                    return glsl(stream, state);

                } else if ( isContentJS(scene, address) && 
                            !/^\|$/g.test(stream.string) && 
                            isAfterTag(stream.string,stream.pos) ){
                    state.token = js;
                    state.localMode = jsMode;
                    state.localState = jsMode.startState( getInd(stream.string) );
                    return js(stream, state);
                }
            } 
            return yamlMode.token(stream, state.yamlState);
        }

        function glsl(stream, state) {
            var address = state.yamlState.tagAddress            
            if ( !isShader(address) || (/^\|$/g.test(stream.string)) ) {
                state.token = yaml;
                state.localState = state.localMode = null;
                return null;
            } 
            return glslMode.token(stream, state.localState);
        }

        function js(stream, state) {
            var address = state.yamlState.tagAddress;
            if ( (!isContentJS(scene, address) || /^\|$/g.test(stream.string) ) ){
                state.token = yaml;
                state.localState = state.localMode = null;
                return null;
            }
            return jsMode.token(stream, state.localState);
        }

        return {
            startState: function() {
                var state = yamlMode.startState();
                state.tags = [];
                state.tagLevel = -1;
                return {
                        token: yaml, 
                        localMode: null, 
                        localState: null,
                        yamlState: state
                    };
            },
            copyState: function(state) {
                if (state.localState)
                    var local = CodeMirror.copyState(state.localMode, state.localState);

                return {
                        token: state.token, 
                        localMode: state.localMode, 
                        localState: local,
                        yamlState: CodeMirror.copyState(yamlMode, state.yamlState), 
                    };
            },
            innerMode: function(state) {
                return {state: state.localState || state.yamlState, 
                        mode: state.localMode || yamlMode };
            },
            token: function(stream, state) {
                yamlAddressing(stream, state.yamlState);
                return state.token(stream, state);
            }
        };
    }, "yaml", "x-shader/x-fragment");

    CodeMirror.defineMIME("text/x-yaml-tangram", "yaml-tangram");
});
