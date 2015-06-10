
//  COMMON FUNCTIONS 
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

// Get array of YAML tags parent tree of a particular line
function getTags(cm, nLine) { return cm.lineInfo(nLine).handle.stateAfter.yamlState.tags; }
// Get string of YAML tags in a folder style
function getTagAddress(cm, nLine) { return cm.lineInfo(nLine).handle.stateAfter.yamlState.tagAddress; }

// Get the YAML content a specific series of tags (array of strings)
function getTagCompleteContent(scene, cm, nLine){
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

//  Function that check if a line is inside a Color Shader Block
function isGlobalBlock(address) {
    return endsWith(address,"shaders/blocks/global");
}

function isPositionBlock(address) {
    return endsWith(address,"shaders/blocks/position");
}

function isNormalBlock(address) {
    return endsWith(address,"shaders/blocks/normal");
}

function isColorBlock(address) {
    return endsWith(address,"shaders/blocks/color");
}

function isFilterBlock(address) {
    return endsWith(address,"shaders/blocks/filter");
}

function isShader(address){
    return (isGlobalBlock(address) || isPositionBlock(address) || isNormalBlock(address) || isColorBlock(address) || isFilterBlock(address));
}

// //  YAML (width tag address)
// //  ===============================================================================
// (function(mod) {
//     if (typeof exports == "object" && typeof module == "object") // CommonJS
//         mod(require("../../lib/codemirror"));
//     else if (typeof define == "function" && define.amd) // AMD
//         define(["../../lib/codemirror"], mod);
//     else // Plain browser env
//         mod(CodeMirror);
// })(function(CodeMirror) {
//     "use strict";

//     CodeMirror.defineMode("yaml", function() {
//         var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
//         var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

//         return {
//             token: function(stream, state) {

//                 // Once per line compute the TAGS tree, NAME, ADDRESS and LEVEL.
//                 if (stream.pos == 0) {
//                     var regex = /(^\s*)(\w+):/gm;
//                     var tag = regex.exec(stream.string);
//                     if ( tag ){

//                         //  If looks like a tag
//                         //  Calculate the number of spaces and indentation level
//                         var spaces = (tag[1].match(/\s/g) || []).length
//                         var level = Math.floor( spaces  / stream.tabSize );

//                         //  Update the TAGS tree
//                         if ( level > state.tagLevel ) {
//                             state.tags.push(tag[2]);
//                         } else if (level === state.tagLevel ) {
//                             state.tags[level] = tag[2];
//                         } if ( level < state.tagLevel ) {
//                             var diff = state.tagLevel - level; 
//                             for (var i = 0; i < diff; i++){
//                                 state.tags.pop();
//                             }
//                             state.tags[level] = tag[2];
//                         }

//                         //  Record all that in the state value
//                         state.tagName = tag[2];
//                         state.tagLevel = level;
//                         state.tagAddress = tags2Address(state.tags);
//                     }
//                 }

//                 var ch = stream.peek();
//                 var esc = state.escaped;
//                 state.escaped = false;

//                 /* comments */
//                 if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
//                     stream.skipToEnd();
//                     return "comment";
//                 }

//                 if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)){
//                     return "string";
//                 }

//                 if (state.literal && stream.indentation() > state.keyCol) {
//                     stream.skipToEnd(); 
//                     return "string";
//                 } else if (state.literal) { 
//                     state.literal = false; 
//                 }

//                 if (stream.sol()) {
//                     state.keyCol = 0;
//                     state.pair = false;
//                     state.pairStart = false;
                
//                     /* document start */
//                     if(stream.match(/---/)) { 
//                         return "def";
//                     }

//                     /* document end */
//                     if (stream.match(/\.\.\./)) { 
//                         return "def"; 
//                     }

//                     /* array list item */
//                     if (stream.match(/\s*-\s+/)) { 
//                         return 'meta'; 
//                     }
//                 }

//                 /* inline pairs/lists */
//                 if (stream.match(/^(\{|\}|\[|\])/)) {
//                     if (ch == '{')
//                         state.inlinePairs++;
//                     else if (ch == '}')
//                         state.inlinePairs--;
//                     else if (ch == '[')
//                         state.inlineList++;
//                     else
//                         state.inlineList--;
//                     return 'meta';
//                 }

//                 /* list seperator */
//                 if (state.inlineList > 0 && !esc && ch == ',') {
//                     stream.next();
//                     return 'meta';
//                 }

//                 /* pairs seperator */
//                 if (state.inlinePairs > 0 && !esc && ch == ',') {
//                     state.keyCol = 0;
//                     state.pair = false;
//                     state.pairStart = false;
//                     stream.next();
//                     return 'meta';
//                 }

//                 /* start of value of a pair */
//                 if (state.pairStart) {
//                     /* block literals */
//                     if (stream.match(/^\s*(\||\>)\s*/)) { 
//                         state.literal = true; 
//                         return 'meta';
//                     };

//                     /* references */
//                     if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) { 
//                         return 'variable-2'; 
//                     }

//                     /* numbers */
//                     if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) { 
//                         return 'number';
//                     }

//                     if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) { 
//                         return 'number'; 
//                     }

//                     /* keywords */
//                     if (stream.match(keywordRegex)) { 
//                         return 'keyword'; 
//                     }
//                 }

//                 /* pairs (associative arrays) -> key */
//                 if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
//                     state.pair = true;
//                     state.keyCol = stream.indentation();
//                     return "atom";
//                 }

//                 if (state.pair && stream.match(/^:\s*/)) { 
//                     state.pairStart = true; return 'meta'; 
//                 }

//                 /* nothing found, continue */
//                 state.pairStart = false;
//                 state.escaped = (ch == '\\');
//                 stream.next();
//                 return null;
//             },

//             startState: function() {
//                 return {
//                     pair: false,
//                     pairStart: false,
//                     keyCol: 0,
//                     inlinePairs: 0,
//                     inlineList: 0,
//                     literal: false,
//                     escaped: false,
//                     tagLevel: -1,
//                     tags: [],
//                 };
//             }
//         };
//     });

//     CodeMirror.defineMIME("text/x-yaml", "yaml");

// });

//  YAML-TANGRAM
//  ===============================================================================
function yamlAddressing(stream, state) {
    // if (!state.tags) state.tags = [];
    // if(state.tagLevel !== undefined) state.tagLevel = -1;

    // Once per line compute the TAGS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        var regex = /(^\s*)(\w+):/gm;
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
        mod(require("../../lib/codemirror"), require("src/codemirror/mode/yaml"), require("src/codemirror/mode/clike"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror", "src/codemirror/mode/yaml", "src/codemirror/mode/clike" ], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("yaml-tangram", function(config, parserConfig) {
        var yamlMode = CodeMirror.getMode(config, "yaml");
        var glslMode = CodeMirror.getMode(config, "x-shader/x-fragment");

        function yaml(stream, state) {
            var address = state.yamlState.tagAddress;
            if ( address !== undefined){
                var regex = /^\s+(\w*)\:\s+\|/gm;
                var header = regex.exec(stream.string);
                header = header ? header[1] : "";

                if (isShader(address) && 
                    header !== "global" &&
                    header !== "position" &&
                    header !== "normal" &&
                    header !== "color" &&
                    header !== "filter" ) {

                    // console.log("shader mode on at " + address);
                        
                    state.token = glsl;
                    state.localMode = glslMode;
                    state.localState = glslMode.startState(getSpaces(stream.string));
                    return glsl(stream, state);
                }
            } 
            return yamlMode.token(stream, state.yamlState);
        }

        function glsl(stream, state) {
            var address = state.yamlState.tagAddress
            var regex = /^\s+(\w*)\:\s+\|/gm;
            var header = regex.exec(stream.string);
            header = header ? header[1] : "";
            if (!isShader(address) || 
                header === "global" ||
                header === "position" ||
                header === "normal" ||
                header === "color" ||
                header === "filter" ) {

                // if (stream.pos === 0) console.log("shader mode off at " + address);

                state.token = yaml;
                state.localState = state.localMode = null;

                return null;
            }

            // if (stream.pos === 0) console.log(stream.string);

            // return yamlMode.token(stream, state);
            return glslMode.token(stream, state.localState);
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
            indent: function(state, textAfter) {
                if (!state.localMode)
                    return yamlMode.indent(state.yamlState, textAfter);
                else if (state.localMode.indent)
                    return state.localMode.indent(state.localState, textAfter);
                else
                    return CodeMirror.Pass;
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
