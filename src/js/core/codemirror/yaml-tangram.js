import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import '../codemirror/glsl-tangram';

// Load some common functions
import { getInd } from '../codemirror/tools';

//  GET public functions
//  ===============================================================================

// Get array of YAML keys parent tree of a particular line
export function getNodes(cm, nLine) {
    if (cm.getLineHandle(nLine) &&
        cm.getLineHandle(nLine).stateAfter &&
        cm.getLineHandle(nLine).stateAfter.yamlState &&
        cm.getLineHandle(nLine).stateAfter.yamlState.nodes) {
        // TEMPORAL_FIX: Fix line parsing error
        let nodes = cm.getLineHandle(nLine).stateAfter.yamlState.nodes;
        for (let i = 0 ; i < nodes.length; i++) {
            nodes[i].range.from.line = nLine;
            nodes[i].range.to.line = nLine;
        }
        return nodes;
    }
    else {
        // return [ {address: "/", key: '', value: '', pos: { line: 0, ch: 0 }, index: 0} ];
        return [];
    }
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
function getAddressFromKeys(keys) {
    if (keys && keys.length > 0) {
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

export function getAddressForLevel(address, level) {
    let keys = getKeysFromAddress(address);
    let newAddress = '';
    for (let i = 0; i < level; i++) {
        newAddress += '/' + keys[i] ;
    }
    return newAddress;
}

//  CHECK
//  ===============================================================================

//  Check if a str ends with a suffix
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

//  Function that check if a line is inside a Color Shader Block
function isGlobalBlock(address) {
    return endsWith(address, 'shaders/blocks/global');
}
function isWidthBlock(address) {
    return endsWith(address, 'shaders/blocks/width');
}
function isPositionBlock(address) {
    return endsWith(address, 'shaders/blocks/position');
}
export function isNormalBlock(address) {
    return endsWith(address, 'shaders/blocks/normal');
}
export function isColorBlock(address) {
    return endsWith(address, 'shaders/blocks/color');
}
function isFilterBlock(address) {
    return endsWith(address, 'shaders/blocks/filter');
}
function isShader(address) {
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
    if (state.nodes) {
        if (state.nodes.length > 0) {
            return state.nodes[0].address;
        }
        else {
            return '/';
        }
    }
    else {
        return '/';
    }
}

function getAnchorFromValue (value) {
    if (/(^\s*(&\w+)\s+)/.test(value)) {
        let link = /(^\s*(&\w+)\s+)/gm.exec(value);
        return link[1];
    }
    else {
        return '';
    }
}

// function isNodeDuplicated(A) {
//     let B = TangramPlay.getNodesForAddress(A);
//     if (B === undefined){
//         return false;
//     }
//     return isNodeEqual(A, B);
// }

// function isNodeEqual (A, B) {
//     if (A && B && A.address && B.address && A.value && B.value) {
//         if (A.address !== B.address) {
//             return false;
//         }
//         if (A.value !== B.value) {
//             return false;
//         }
//         else if (A.range.from.line !== B.range.from.line) {
//             return false;
//         }
//         else if (A.range.to.line !== B.range.to.line) {
//             return false;
//         }
//         else if (A.range.to.ch !== B.range.to.ch) {
//             return false;
//         }
//         else if (A.range.from.ch !== B.range.from.ch) {
//             return false;
//         }
//         return true;
//     }
//     return true;
// }

// Given a YAML string return an array of keys
function getInlineNodes(str, nLine) {
    let rta = [];
    let stack = [];
    let i = 0;
    let level = -1;

    while (i < str.length) {
        let curr = str.substr(i, 1);
        if (curr === '{') {
            // Go one level up
            stack.push('/');
            level++;
        }
        else if (curr === '}') {
            // Go one level down
            stack.pop();
            level--;
        }
        else {
            // check for keypair
            let isNode = /^\s*([\w|\-|\_|\$]+)(\s*:\s*)([\w|\-|\'|\#]*)\s*/gm.exec(str.substr(i));
            if (isNode) {
                stack[level] = isNode[1];
                i += isNode[1].length;

                let key = isNode[1];
                let colon = isNode[2];
                let value = isNode[3];
                var isVector = str.substr(i + 1 + colon.length).match(/^\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/gm);
                if (isVector) {
                    value = isVector[0];
                }
                let anchor = getAnchorFromValue(value);
                value = value.substr(anchor.length);

                rta.push({
                    address: getAddressFromKeys(stack),
                    key: key,
                    value: value,
                    anchor: anchor,
                    range: {
                        from: {
                            line: nLine,
                            ch: i + 1 - key.length },
                        to: {
                            line: nLine,
                            ch: i + colon.length + value.length + 1 },
                    },
                    index: rta.length + 1
                });
            }
        }
        i++;
    }
    return rta;
}

// Add Address to token states
function yamlAddressing(stream, state) {
    // Once per line compute the KEYS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        parseYamlString(stream.string, state, stream.tabSize);
    }
}

// Add Address to token states
export function parseYamlString(string, state, tabSize) {
    // TODO:
    //  - add an extra \s* before the :
    //  - break all this into smaller and reusable functions
    //  - get rid of the pos
    //
    let regex = /(^\s*)([\w|\-|\_]+)(\s*:\s*)([\w|\W]*)\s*$/gm;
    let node = regex.exec(string);

    // node[0] = all the matching line
    // node[1] = spaces
    // node[2] = key
    // node[3] = "\s*:\s*"
    // node[4] = value (if there is one)
    //
    if (node) {
        //  If looks like a node
        //  Calculate the number of spaces and indentation level
        let spaces = (node[1].match(/\s/g) || []).length;
        let level = Math.floor(spaces / tabSize);

        //  Update the nodeS tree
        if (level > state.keyLevel) {
            state.keyStack.push(node[2]);
        }
        else if (level === state.keyLevel) {
            state.keyStack[level] = node[2];
        }
        else if (level < state.keyLevel) {
            let diff = state.keyLevel - level;
            for (let i = 0; i < diff; i++) {
                state.keyStack.pop();
            }
            state.keyStack[level] = node[2];
        }

        //  Record all that in the state value
        state.keyLevel = level;

        let address = getAddressFromKeys(state.keyStack);
        let fromCh = spaces;
        let toCh = spaces + node[2].length + node[3].length;

        if (node[4].substr(0, 1) === '{') {
            // If there are multiple keys
            state.nodes = [ {
                address: address,
                key: node[2],
                value: '',
                anchor: '',
                range: {
                    from: {
                        line: state.line,
                        ch: fromCh },
                    to: {
                        line: state.line,
                        ch: toCh }
                },
                index: 0
            } ];

            let subNodes = getInlineNodes(node[4],
                state.line);
            for (let i = 0; i < subNodes.length; i++) {
                subNodes[i].address = address + subNodes[i].address;
                subNodes[i].range.from.ch += spaces + node[2].length + node[3].length;
                subNodes[i].range.to.ch += spaces + node[2].length + node[3].length;
                state.nodes.push(subNodes[i]);
            }
        }
        else {
            let anchor = getAnchorFromValue(node[4]);
            toCh += node[4].length;
            state.nodes = [ {
                address: address,
                key: node[2],
                anchor: anchor,
                value: node[4].substr(anchor.length),
                range: {
                    from: {
                        line: state.line,
                        ch: fromCh },
                    to: {
                        line: state.line,
                        ch: toCh }
                },
                index: 0
            } ];
        }
    }
    else {
        // Commented or empty lines lines
        state.nodes = [ {
            address: getAddressFromKeys(state.keyStack),
            key: '',
            value: '',
            anchor: '',
            range: {
                from: {
                    line: state.line,
                    ch: 0 },
                to: {
                    line: state.line,
                    ch: 0 }
            },
            index: 0
        } ];
    }
}

//  YAML-TANGRAM
//  ===============================================================================
CodeMirror.defineMode('yaml-tangram', function(config, parserConfig) {
    let yamlMode = CodeMirror.getMode(config, 'yaml');
    let glslMode = CodeMirror.getMode(config, 'glsl');

    let jsMode = CodeMirror.getMode(config, 'javascript');
    yamlMode.lineComment = '#';

    function yaml (stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if (address !== undefined) {
            let key = /^\s+(\w*)\:\s+\|/gm.exec(stream.string);
            key = key ? key[1] : '';

            if (isShader(address) &&
                !/^\|$/g.test(stream.string) &&
                isAfterKey(stream.string, stream.pos)) {
                state.token = glsl;
                state.localMode = glslMode;
                state.localState = glslMode.startState(getInd(stream.string));
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

    function glsl (stream, state) {
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
    function js (stream, state) {
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
