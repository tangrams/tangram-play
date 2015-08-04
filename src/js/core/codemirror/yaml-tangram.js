import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';

// Load some common functions
import { getInd } from './tools.js';

//  GET public functions
//  ===============================================================================

// Get array of YAML keys parent tree of a particular line
export function getKeyPairs(cm, nLine) {
    if (cm.getLineHandle(nLine) &&
        cm.getLineHandle(nLine).stateAfter &&
        cm.getLineHandle(nLine).stateAfter.yamlState &&
        cm.getLineHandle(nLine).stateAfter.yamlState.keys) {
        // TEMPORAL_FIX: Fix line parsing error
        let keys = cm.getLineHandle(nLine).stateAfter.yamlState.keys;
        for (let i = 0 ; i < keys.length; i++) {
            keys[i].pos.line = nLine;
        }
        return keys;
    }
    else {
        // return [ {address: "/", key: '', value: '', pos: { line: 0, ch: 0 }, index: 0} ];
        return [];
    }
}

export function getValueRange(keyPair) {
    return {
        from: {
            line: keyPair.pos.line,
            ch: keyPair.pos.ch + 2 },
        to: {
            line: keyPair.pos.line,
            ch: keyPair.pos.ch + 2 + keyPair.value.length }
    };
}

export function getAddressSceneContent(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        let keys = getKeysFromAddress(address);
        if (keys && keys.length) {
            let content = tangramScene.config[keys[0]];
            if (content) {
                for (let i = 1; i < keys.length; i++) {
                    if (content[keys[i]]) {
                        content = content[keys[i]];
                    }
                    else {
                        return content;
                    }
                }
                return content;
            }
            else {
                return '';
            }
        }
        else {
            return '';
        }
    }
    else {
        return '';
    }
}

// Make an folder style address from an array of keys
export function getAddressFromKeys(keys) {
    if (keys) {
        let address = '';
        for (let i = 0; i < keys.length; i++) {
            address += '/' + keys[i] ;
        }
        return address;
    }
    else {
        return '/';
    }
}

export function getKeysFromAddress(address) {
    let keys = address.split('/');
    keys.shift();
    return keys;
}

//  CHECK
//  ===============================================================================

//  Check if a str ends with a suffix
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

//  Function that check if a line is inside a Color Shader Block
export function isGlobalBlock(address) {
    return endsWith(address, 'shaders/blocks/global');
}
export function isWidthBlock(address) {
    return endsWith(address, 'shaders/blocks/width');
}
export function isPositionBlock(address) {
    return endsWith(address, 'shaders/blocks/position');
}
export function isNormalBlock(address) {
    return endsWith(address, 'shaders/blocks/normal');
}
export function isColorBlock(address) {
    return endsWith(address, 'shaders/blocks/color');
}
export function isFilterBlock(address) {
    return endsWith(address, 'shaders/blocks/filter');
}
export function isShader(address) {
    return (
        isGlobalBlock(address) ||
        isWidthBlock(address) ||
        isPositionBlock(address) ||
        isNormalBlock(address) ||
        isColorBlock(address) ||
        isFilterBlock(address)
    );
}

function isContentJS(tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        return /\s*[\|]*\s*function\s*\(\s*\)\s*\{/gm.test(getAddressSceneContent(tangramScene, address));
    }
    else {
        return false;
    }
}

function isAfterKey(str, pos) {
    let key = /^\s*(\w+):/gm.exec(str);
    if (key === undefined) {
        return true;
    }
    else {
        return [0].length < pos;
    }
}

//  Special Tangram YAML Parser
//  ===============================================================================

//  Get the address of a line state ( usually from the first key of a line )
function getKeyAddressFromState(state) {
    if (state.keys) {
        if (state.keys.length > 0) {
            return state.keys[0].address;
        }
        else {
            return '/';
        }
    }
    else {
        return '/';
    }
}

// Given a YAML string return an array of keys
function getInlineKeys(str, nLine) {
    let rta = [];
    let keys = [];
    let i = 0;
    let level = -1;

    while (i < str.length) {
        let curr = str.substr(i, 1);
        if (curr === '{') {
            // Go one level up
            keys.push('/');
            level++;
        }
        else if (curr === '}') {
            // Go one level down
            keys.pop();
            level--;
        }
        else {
            // check for keypair
            let isKey = /^\s*([\w|\-|\_|\$]+):\s*([\w|\'|\#]*)\s*/gm.exec(str.substr(i));
            if (isKey) {
                keys[level] = isKey[1];
                i += isKey[1].length;
                rta.push({
                    address: getAddressFromKeys(keys),
                    key: isKey[1],
                    value: isKey[2],
                    pos: {
                        line: nLine,
                        ch: i + 1
                    },
                    index: rta.length + 1
                });
            }
        }

        var isVector = str.substr(i).match(/^\s*\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/gm);
        if (isVector && rta.length > 0) {
            rta[rta.length - 1].value = isVector[0];
        }

        i++;
    }
    return rta;
}

// Add Address to token states
function yamlAddressing(stream, state) {
    // Once per line compute the KEYS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        let regex = /(^\s*)([\w|\-|\_]+):\s*([\w|\W]*)\s*$/gm;
        let key = regex.exec(stream.string);
        if (key) {
            //  If looks like a key
            //  Calculate the number of spaces and indentation level
            let spaces = (key[1].match(/\s/g) || []).length;
            let level = Math.floor(spaces / stream.tabSize);

            //  Update the keyS tree
            if (level > state.keyLevel) {
                state.keyStack.push(key[2]);
            }
            else if (level === state.keyLevel) {
                state.keyStack[level] = key[2];
            }
            else if (level < state.keyLevel) {
                let diff = state.keyLevel - level;
                for (let i = 0; i < diff; i++) {
                    state.keyStack.pop();
                }
                state.keyStack[level] = key[2];
            }

            //  Record all that in the state value
            state.keyLevel = level;

            let address = getAddressFromKeys(state.keyStack);
            let ch = spaces + key[2].length;

            if (key[3].substr(0, 1) === '{') {
                state.keys = [ {
                    address: address,
                    key: key[2],
                    value: '',
                    pos: {
                        line: state.line,
                        ch: ch },
                    index: 0
                } ];

                let subKeys = getInlineKeys(key[3],
                    state.line);
                for (let i = 0; i < subKeys.length; i++) {
                    subKeys[i].address = address + subKeys[i].address;
                    subKeys[i].pos.ch = ch + 2 + subKeys[i].pos.ch;
                    state.keys.push(subKeys[i]);
                }
            }
            else {
                state.keys = [ {
                    address: address,
                    key: key[2],
                    value: key[3],
                    pos: {
                        line: state.line,
                        ch: ch },
                    index: 0
                } ];
            }
        }
        else {
            // Commented or empty lines lines
            state.keys = [ {
                address: getAddressFromKeys(state.keyStack),
                key: '',
                value: '',
                pos: {
                    line: state.line,
                    ch: 0 },
                index: 0
            } ];
        }
    }
}

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }

//  YAML-TANGRAM
//  ===============================================================================
CodeMirror.defineMode('yaml-tangram', function(config, parserConfig) {
    let yamlMode = CodeMirror.getMode(config, 'yaml');
    let glslMode = CodeMirror.getMode(config, 'glsl');
    let jsMode = CodeMirror.getMode(config, 'javascript');
    yamlMode.lineComment = '#';

    function yaml(stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if (address !== undefined) {
            let key = /^\s+(\w*)\:\s+\|/gm.exec(stream.string);
            key = key ? key[1] : '';

            if (isShader(address) &&
                !/^\|$/g.test(stream.string) &&
                isAfterKey(stream.string, stream.pos)) {
                state.token = glsl;
                state.localMode = glslMode;
                // state.localState = glslMode.startState(getInd(stream.string));
                state.localState = {
                    tokenize: null,
                    context: {
                        column: 0,
                        indented: (getInd(stream.string)) - 4,
                        type: 'top',
                        align: false
                    },
                    indented: 0,
                    startOfLine: true
                  };
                return glsl(stream, state);
            }
            else if (isContentJS(window.scene, address) &&
                        !/^\|$/g.test(stream.string) &&
                        isAfterKey(stream.string, stream.pos)) {
                state.token = js;
                state.localMode = jsMode;
                state.localState = jsMode.startState(getInd(stream.string));
                return js(stream, state);
            }
        }

        if (stream.pos === 0) {
            state.yamlState.line++;
        }

        return yamlMode.token(stream, state.yamlState);
    }

    function glsl(stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if (!isShader(address) || (/^\|$/g.test(stream.string))) {
            state.token = yaml;
            state.localState = state.localMode = null;
            return null;
        }
        if (stream.pos === 0) {
            state.yamlState.line++;
        }
        return glslMode.token(stream, state.localState);
    }

    //  TODO:
    //        Replace global scene by a local
    //
    function js(stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if ((!isContentJS(window.scene, address) || /^\|$/g.test(stream.string))) {
            state.token = yaml;
            state.localState = state.localMode = null;
            return null;
        }
        if (stream.pos === 0) {
            state.yamlState.line++;
        }
        return jsMode.token(stream, state.localState);
    }

    return {
        startState: function() {
            let state = yamlMode.startState();
            state.keyStack = [];
            state.keyLevel = -1;
            state.line = 0;
            return {
                token: yaml,
                localMode: null,
                localState: null,
                yamlState: state
            };
        },
        copyState: function(state) {
            if (state.localState) {
                var local = CodeMirror.copyState(state.localMode, state.localState);
            }
            return {
                token: state.token,
                localMode: state.localMode,
                localState: local,
                yamlState: CodeMirror.copyState(yamlMode, state.yamlState),
            };
        },
        innerMode: function(state) {
            return {
                state: state.localState || state.yamlState,
                mode: state.localMode || yamlMode
            };
        },
        token: function(stream, state) {
            yamlAddressing(stream, state.yamlState);
            return state.token(stream, state);
        },
        fold: 'indent'
    };
}, 'yaml', 'x-shader/x-fragment');

CodeMirror.defineMIME('text/x-yaml-tangram', 'yaml-tangram');
