import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js'

import { setValue, getInd, getValue  } from './tools.js';

//  GET Functions
//  ===============================================================================

export function getKey(cm, nLine) {
    let key = /^\s*([\w|\-|\_]+):/gm.exec(cm.lineInfo(nLine).text);
    return key ? key[1] : "" ;
};

// Get array of YAML keys parent tree of a particular line
export function getKeys(cm, nLine) { return cm.lineInfo(nLine).handle.stateAfter.yamlState.keys; };
// Get string of YAML keys in a folder style
export function getKeyAddress(cm, nLine) {
    if (cm.lineInfo(nLine).handle.stateAfter &&
        cm.lineInfo(nLine).handle.stateAfter.yamlState &&
        cm.lineInfo(nLine).handle.stateAfter.yamlState.keyAddress) {
        return cm.lineInfo(nLine).handle.stateAfter.yamlState.keyAddress;
    } else {
        return "/";
    }
};

// Get the YAML content a specific series of keys (array of strings)
export function getKeySceneContent(tangramScene, cm, nLine) {
    let keys = getKeys(cm, nLine);
    let tmp = tangramScene.config[keys[0]];
    for (let i = 1; i < keys.length; i++) {
        if (tmp[ keys[i] ]) {
            tmp = tmp[ keys[i] ];
        } else {
            return tmp;
        }
    }
    return tmp;
};

export function getAddressSceneContent(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        let keys = address.split("/");
        keys.shift();
        if (keys && keys.length) {
            let content = tangramScene.config[keys[0]];
            for (let i = 1; i < keys.length; i++) {
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
export function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1;};

//  Function that check if a line is inside a Color Shader Block
export function isGlobalBlock(address) { return endsWith(address,"shaders/blocks/global"); };
export function isWidthBlock(address) { return endsWith(address,"shaders/blocks/width"); };
export function isPositionBlock(address) { return endsWith(address,"shaders/blocks/position"); };
export function isNormalBlock(address) { return endsWith(address,"shaders/blocks/normal"); };
export function isColorBlock(address) { return endsWith(address,"shaders/blocks/color"); };
export function isFilterBlock(address) { return endsWith(address,"shaders/blocks/filter"); };
export function isShader(address) { return (isGlobalBlock(address) || isWidthBlock(address)  || isPositionBlock(address) || isNormalBlock(address) || isColorBlock(address) || isFilterBlock(address)); };

export function isContentJS(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        return /\s*[\|]*\s*function\s+\(\s+\)\s*\{/gm.test(getAddressSceneContent(tangramScene, address));
    } else {
        return false;
    }
};

export function isAfterKey(str,pos) {
    let key = /^\s*(\w+):/gm.exec(str);
    if (key === undefined) {
        return true;
    } else {
        return [0].length < pos;
    }
};

//  Generate a token functions using RegEx
export function addToken( tokenOBJ ) {
    let token;
    if ( tokenOBJ['address'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['address'] ).test( getKeyAddress(cm, nLine) );
        };
    } else if ( tokenOBJ['key'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['key'] ).test( getKey(cm, nLine) );
        };
    } else if ( tokenOBJ['value'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['value'] ).test( getValue(cm, nLine) );
        };
    } else if ( tokenOBJ['content'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['content'] ).test( getKeySceneContent(scene, cm, nLine) );
        };
    } else {
        token = function(scene, cm, nLine) {
            return false;
        };
    }
    return token;
};

//  CONVERT
//  ===============================================================================

// Make an folder style address from an array of keys
export function keys2Address(keys) {
    if (keys) {
         let address = "";
        for ( let i = 0; i < keys.length; i++) {
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
        let regex = /(^\s*)([\w|\-|\_]+):/gm;
        let key = regex.exec(stream.string);
        if (key) {

            //  If looks like a key
            //  Calculate the number of spaces and indentation level
            let spaces = (key[1].match(/\s/g) || []).length
            let level = Math.floor(spaces  / stream.tabSize);

            //  Update the keyS tree
            if (level > state.keyLevel) {
                state.keys.push(key[2]);
            } else if (level === state.keyLevel) {
                state.keys[level] = key[2];
            } if ( level < state.keyLevel ) {
                let diff = state.keyLevel - level;
                for (let i = 0; i < diff; i++) {
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

//  YAML-TANGRAM
//  ===============================================================================
CodeMirror.defineMode("yaml-tangram", function(config, parserConfig) {
    let yamlMode = CodeMirror.getMode(config, "yaml");
    let glslMode = CodeMirror.getMode(config, "glsl");
    let jsMode = CodeMirror.getMode(config, "javascript");

    function yaml(stream, state) {
        let address = state.yamlState.keyAddress;
        if ( address !== undefined) {

            let key = /^\s+(\w*)\:\s+\|/gm.exec(stream.string);
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
        let address = state.yamlState.keyAddress
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
        let address = state.yamlState.keyAddress;
        if ( (!isContentJS(scene, address) || /^\|$/g.test(stream.string) ) ) {
            state.token = yaml;
            state.localState = state.localMode = null;
            return null;
        }
        return jsMode.token(stream, state.localState);
    };

    return {
        startState: function() {
            let state = yamlMode.startState();
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
