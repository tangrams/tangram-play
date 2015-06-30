'use strict';

const CodeMirror = require('codemirror');

module.exports = {
    setValue,
    getKey,
    getKeyAddress,
    getValue,
    getKeySceneContent,
    getAddressSceneContent,
    getSpaces
}

//  SET Functions
//  ===============================================================================
function setValue(cm, nLine, string) {
    var line = cm.lineInfo(nLine).text;
    var key = /^\s*(\w+):\s*/gm.exec( line );
    if (key) {
        cm.replaceRange(string, {line: nLine, ch:key[0].length}, {line: nLine, ch:line.length});
    }
};

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
};

function getKey(cm, nLine) {
    var key = /^\s*([\w|\-|\_]+):/gm.exec(cm.lineInfo(nLine).text);
    return key ? key[1] : "" ;
};

// Get array of YAML keys parent tree of a particular line
function getKeys(cm, nLine) { return cm.lineInfo(nLine).handle.stateAfter.yamlState.keys; };
// Get string of YAML keys in a folder style
function getKeyAddress(cm, nLine) {
    if (cm.lineInfo(nLine).handle.stateAfter &&
        cm.lineInfo(nLine).handle.stateAfter.yamlState &&
        cm.lineInfo(nLine).handle.stateAfter.yamlState.keyAddress) {
        return cm.lineInfo(nLine).handle.stateAfter.yamlState.keyAddress;
    } else {
        return "/";
    }
};

//  Get value of a key pair
function getValue(cm, nLine) {
    var value = /^\s*\w+:\s*([\w|\W|\s]+)$/gm.exec( cm.lineInfo(nLine).text );
    return value ? value[1] : "" ;
};

// Get the YAML content a specific series of keys (array of strings)
function getKeySceneContent(tangramScene, cm, nLine) {
    var keys = getKeys(cm, nLine);
    var tmp = tangramScene.config[keys[0]];
    for (var i = 1; i < keys.length; i++) {
        if (tmp[ keys[i] ]) {
            tmp = tmp[ keys[i] ];
        } else {
            return tmp;
        }
    }
    return tmp;
};

function getAddressSceneContent(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        var keys = address.split("/");
        keys.shift();
        if (keys && keys.length > 0) {
            var content = tangramScene.config[keys[0]];
            for (var i = 1; i < keys.length; i++) {
                if (content[keys[i]]) {
                    content = content[keys[i]];
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
};

//  CHECK
//  ===============================================================================

//  Check if a str ends with a suffix
function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1;};

//  Function that check if a line is inside a Color Shader Block
function isGlobalBlock(address) { return endsWith(address,"shaders/blocks/global"); };
function isWidthBlock(address) { return endsWith(address,"shaders/blocks/width"); };
function isPositionBlock(address) { return endsWith(address,"shaders/blocks/position"); };
function isNormalBlock(address) { return endsWith(address,"shaders/blocks/normal"); };
function isColorBlock(address) { return endsWith(address,"shaders/blocks/color"); };
function isFilterBlock(address) { return endsWith(address,"shaders/blocks/filter"); };
function isShader(address) { return (isGlobalBlock(address) || isWidthBlock(address)  || isPositionBlock(address) || isNormalBlock(address) || isColorBlock(address) || isFilterBlock(address)); };

function isContentJS(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        return /\s*[\|]*\s*function\s+\(\s+\)\s*\{/gm.test(getAddressSceneContent(tangramScene, address));
    } else {
        return false;
    }
};

function isAfterKey(str,pos) {
    var key = /^\s*(\w+):/gm.exec(str);
    if (key === undefined) {
        return true;
    } else {
        return [0].length < pos;
    }
};

//  CONVERT
//  ===============================================================================

// Make an folder style address from an array of keys
function keys2Address(keys) {
    if (keys) {
         var address = "";
        for ( var i = 0; i < keys.length; i++) {
            address += "/" + keys[i] ;
        }
        return address;
    } else {
        return "/"
    }
};

//  YAML
//  ===============================================================================

// Add Address to token states
function yamlAddressing(stream, state) {
    // Once per line compute the KEYS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        var regex = /(^\s*)([\w|\-|\_]+):/gm;
        var key = regex.exec(stream.string);
        if (key) {

            //  If looks like a key
            //  Calculate the number of spaces and indentation level
            var spaces = (key[1].match(/\s/g) || []).length
            var level = Math.floor(spaces  / stream.tabSize);

            //  Update the keyS tree
            if (level > state.keyLevel) {
                state.keys.push(key[2]);
            } else if (level === state.keyLevel) {
                state.keys[level] = key[2];
            } if ( level < state.keyLevel ) {
                var diff = state.keyLevel - level;
                for (var i = 0; i < diff; i++) {
                    state.keys.pop();
                }
                state.keys[level] = key[2];
            }

            //  Record all that in the state value
            state.keyName = key[2];
            state.keyLevel = level;
            state.keyAddress = keys2Address(state.keys);
        }
    }
};

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["codemirror"], mod);
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

                if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)) {
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
    };

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
/*
(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("codemirror"));
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";
*/

    CodeMirror.defineMode("yaml-tangram", function(config, parserConfig) {
        var yamlMode = CodeMirror.getMode(config, "yaml");
        var glslMode = CodeMirror.getMode(config, "glsl");
        var jsMode = CodeMirror.getMode(config, "javascript");

        // Don't require at top of this js file, it creates a circular dependency
        const Editor = require('../core/editor.js');
        const getInd = Editor.getInd;

        function yaml(stream, state) {
            var address = state.yamlState.keyAddress;
            if ( address !== undefined) {

                var key = /^\s+(\w*)\:\s+\|/gm.exec(stream.string);
                key = key ? key[1] : "";

                if (isShader(address) &&
                    !/^\|$/g.test(stream.string) &&
                    isAfterKey(stream.string,stream.pos)) {
                    state.token = glsl;
                    state.localMode = glslMode;
                    state.localState = glslMode.startState(getInd(stream.string));
                    return glsl(stream, state);

                    //  TODO:
                    //        Replace global scene by a local
                    //
                } else if (isContentJS(scene, address) &&
                            !/^\|$/g.test(stream.string) &&
                            isAfterKey(stream.string,stream.pos)) {
                    state.token = js;
                    state.localMode = jsMode;
                    state.localState = jsMode.startState(getInd(stream.string));
                    return js(stream, state);
                }
            }
            return yamlMode.token(stream, state.yamlState);
        };

        function glsl(stream, state) {
            var address = state.yamlState.keyAddress
            if ( !isShader(address) || (/^\|$/g.test(stream.string)) ) {
                state.token = yaml;
                state.localState = state.localMode = null;
                return null;
            }
            return glslMode.token(stream, state.localState);
        };

        //  TODO:
        //        Replace global scene by a local
        //
        function js(stream, state) {
            var address = state.yamlState.keyAddress;
            if ( (!isContentJS(scene, address) || /^\|$/g.test(stream.string) ) ) {
                state.token = yaml;
                state.localState = state.localMode = null;
                return null;
            }
            return jsMode.token(stream, state.localState);
        };

        return {
            startState: function() {
                var state = yamlMode.startState();
                state.keys = [];
                state.keyLevel = -1;
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
/*
});
*/
