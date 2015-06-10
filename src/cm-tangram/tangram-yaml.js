
//  COMMON FUNCTIONS 
//  ===============================================================================

// Check if a line is commented
//
function getLineTag(cm, nLine){
    if (nLine >= 0){
        var regex = /^\s*(\w+):/gm;
        var tags = ( regex.exec(cm.lineInfo(nLine).text) || []);
        // console.log(tags);
        if (tags.length > 0){
            return { 'line': nLine, 'name' : tags[1] };
        } else {
            return getLineTag(cm, nLine-1);
        }
    }  
}

//  Get Parent line according to indentation
//
function getParentLine(cm, nLine){
    var level = getIndLevel(cm,nLine);
    for (var i = nLine-1; i >= 0; i--){
        if ( !isEmpty(cm, i) && getIndLevel(cm,i) === level-1 ){
            return i;
        }
    }
    return nLine;
}

//  Get array of YAML tags parent tree of a particular line in inverse order 
//
function getInverseTags(cm, nLine){
    var tags = [];
    var line = nLine;
    var level = 1;
    while (level > 0){
        var tag = getLineTag(cm,line);

        // Prevent errors
        if (tag.name){
            tags.push(tag.name);
            level = getIndLevel(cm,tag.line);
            var parentLine = getParentLine(cm,tag.line);
            line = parentLine;
        } else {
            return tags;
        }
    }
    return tags;
}

// Get array of YAML tags parent tree of a particular line
//
function getTags(cm, nLine) {
    var invTags = getInverseTags(cm, nLine);
    var tags = [];
    for (var i = invTags.length-1; i >= 0; i--){
        tags.push(invTags[i]);
    }
    return tags;
}

// Get the YAML content a specific series of tags (array of strings)
//
function getYAMLContent(sceneConfig, tags){
    var tmp = sceneConfig[ tags[0] ];
    for (var i = 1; i < tags.length; i++){
        if (tmp[ tags[i] ]){
            tmp = tmp[ tags[i] ];
        } else {
            return tmp;
        }
    }
    return tmp;
}

// Make an folder style address from an array of tags
//
function tagsToAddress(tags){
    var address = "";
    for ( var i = 0; i < tags.length; i++){
        address += "/" + tags[i] ;
    }
    return address;
}

//  Function that check if a line is inside a Color Shader Block
//
function getColorBlockShader(cm, nLine) {
    var invTags = getInverseTags(cm, nLine)
    var address = tagsToAddress( invTags );

    // console.log(address); 
    // console.log(address.indexOf("/color/blocks/shaders/"));
    if (address.indexOf("/color/blocks/shaders/") === 0){
        var styleName = invTags[3];
        // console.log(styleName);
        var style = scene.styles[styleName];
        if (style){
            return style["shaders"];
        } else {
            return {};
        }
    } else {
        return {};
    }
}

//  YAML (width tag address)
//  ===============================================================================
(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("yaml", function() {
        var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
        var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

        return {
            token: function(stream, state) {
                if (stream.pos == 0){
                    var regex = /(^\s*)(\w+):/gm;
                    var tag = regex.exec(stream.string);
                    if ( tag ){
                        var spaces = (tag[1].match(/\s/g) || []).length
                        var level = Math.floor( spaces  / stream.tabSize );

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

                        state.tagName = tag[2];
                        state.tagLevel = level;
                        state.tagAddress = "";
                        for ( var i = 0; i < state.tags.length; i++){
                            state.tagAddress += "/" + state.tags[i] ;
                        }
                        // console.log(state.tagAddress);
                    }
                }

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
                    escaped: false,
                    tagLevel: -1,
                    tags: [],
                };
            }
        };
    });

CodeMirror.defineMIME("text/x-yaml", "yaml");

});

//  TANGRAM-YAML
//  ===============================================================================
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// (function(mod) {
//   if (typeof exports == "object" && typeof module == "object") // CommonJS
//     mod(require("src/codemirror"), require("src/codemirror/mode/yaml"), require("src/codemirror/mode/glsl"), require("src/codemirror/mode/javascript"));
//   else if (typeof define == "function" && define.amd) // AMD
//     define(["src/codemirror", "src/codemirror/mode/yaml", "src/codemirror/mode/glsl", "src/codemirror/javascript"], mod);
//   else // Plain browser env
//     mod(CodeMirror);
// })(function(CodeMirror) {
// "use strict";

// CodeMirror.defineMode("tangram-yaml", function(config, parserConfig) {
//   var yamlMode = CodeMirror.getMode(config, {	name: "tangram-yaml",
//   												yamlMode: true,
//                                              	multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
//                                             	multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag});
//   var glslMode = CodeMirror.getMode(config, "glsl");
//   var jsMode = CodeMirror.getMode(config, "javascript");

//   function yaml(stream, state) {

//     var tagName = state.tagAddress;
//     var style = yamlMode.token(stream, state);

//     // if (tagName == "script" && /\btag\b/.test(style) && stream.current() == ">") {
//     //   // Script block: mode to change to depends on type attribute
//     //   var scriptType = stream.string.slice(Math.max(0, stream.pos - 100), stream.pos).match(/\btype\s*=\s*("[^"]+"|'[^']+'|\S+)[^<]*$/i);
//     //   scriptType = scriptType ? scriptType[1] : "";
//     //   if (scriptType && /[\"\']/.test(scriptType.charAt(0))) scriptType = scriptType.slice(1, scriptType.length - 1);
//     //   for (var i = 0; i < scriptTypes.length; ++i) {
//     //     var tp = scriptTypes[i];
//     //     if (typeof tp.matches == "string" ? scriptType == tp.matches : tp.matches.test(scriptType)) {
//     //       if (tp.mode) {
//     //         state.token = script;
//     //         state.localMode = tp.mode;
//     //         state.localState = tp.mode.startState && tp.mode.startState(yamlMode.indent(state.htmlState, ""));
//     //       }
//     //       break;
//     //     }
//     //   }
//     // } else if (tagName == "style" && /\btag\b/.test(style) && stream.current() == ">") {
//     //   state.token = css;
//     //   state.localMode = cssMode;
//     //   state.localState = cssMode.startState(yamlMode.indent(state.htmlState, ""));
//     // }
//     return style;
//   }

//   function maybeBackup(stream, pat, style) {
//     var cur = stream.current();
//     var close = cur.search(pat);
//     if (close > -1) stream.backUp(cur.length - close);
//     else if (cur.match(/<\/?$/)) {
//       stream.backUp(cur.length);
//       if (!stream.match(pat, false)) stream.match(cur);
//     }
//     return style;
//   }

//   function script(stream, state) {
//     if (stream.match(/^<\/\s*script\s*>/i, false)) {
//       state.token = html;
//       state.localState = state.localMode = null;
//       return null;
//     }
//     return maybeBackup(stream, /<\/\s*script\s*>/,
//                        state.localMode.token(stream, state.localState));
//   }

//   function css(stream, state) {
//     if (stream.match(/^<\/\s*style\s*>/i, false)) {
//       state.token = html;
//       state.localState = state.localMode = null;
//       return null;
//     }
//     return maybeBackup(stream, /<\/\s*style\s*>/,
//                        cssMode.token(stream, state.localState));
//   }

//   return {
//     startState: function() {
//       var state = yamlMode.startState();
//       return {token: yaml, localMode: null, localState: null, htmlState: state};
//     },

//     copyState: function(state) {
//       if (state.localState)
//         var local = CodeMirror.copyState(state.localMode, state.localState);
//       return {token: state.token, localMode: state.localMode, localState: local,
//               htmlState: CodeMirror.copyState(yamlMode, state.htmlState)};
//     },

//     token: function(stream, state) {
//       return state.token(stream, state);
//     },

//     indent: function(state, textAfter) {
//       if (!state.localMode || /^\s*<\//.test(textAfter))
//         return yamlMode.indent(state.htmlState, textAfter);
//       else if (state.localMode.indent)
//         return state.localMode.indent(state.localState, textAfter);
//       else
//         return CodeMirror.Pass;
//     },

//     innerMode: function(state) {
//       return {state: state.localState || state.htmlState, mode: state.localMode || yamlMode};
//     }
//   };
// }, "yaml", "glsl", "javascript");

// CodeMirror.defineMIME("text/x-yaml", "tangram-yaml");

// });
