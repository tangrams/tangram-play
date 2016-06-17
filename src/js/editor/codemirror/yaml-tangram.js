import _ from 'lodash';
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import './glsl-tangram';

import { tangramScene } from '../../map/map';

// Load some common functions
import { getInd } from './tools';

const ADDRESS_KEY_DELIMITER = ':';

// GET public functions
// =============================================================================

/**
 * Returns the content given an address
 * If for any reason the content is not found, return an empty string
 *
 * @param {Object} tangramScene - Tangram's parsed object tree of scene content
 * @param {string} address - in the form of 'key1:key2:key3'
 * @return {mixed} content - Whatever is stored as a value for that key
 */
export function getAddressSceneContent (tangramScene, address) {
    try {
        const keys = getKeysFromAddress(address);

        // Looks up content in Tangram's scene.config property.
        // It's a nested object, so to look up from an array of nested keys,
        // we reduce this array down to a single reference.
        // e.g. ['a', 'b', 'c'] looks up content in
        // tangramScene.config['a']['b']['c']
        const content = keys.reduce((obj, property) => {
            return obj[property];
        }, tangramScene.config);

        return content;
    }
    catch (error) {
        return '';
    }
}

/**
 * Return a string address from an array of key names
 *
 * @param {Array} keys - an array of keys
 * @return {string} address - in the form of 'key1:key2:key3'
 */
function getAddressFromKeys (keys) {
    return keys.join(ADDRESS_KEY_DELIMITER);
}

/**
 * Return an array of key names from an address
 * An empty string will still return an array whose first item
 * is the empty string.
 *
 * @param {string} address - in the form of 'key1:key2:key3'
 * @return {Array} keys
 */
export function getKeysFromAddress (address) {
    return address.split(ADDRESS_KEY_DELIMITER);
}

/**
 * Return a string address, truncated to a certain level
 *
 * @param {string} address  - in the form of 'key1:key2:key3'
 * @param {Number} level - the level of address to obtain
 * @return {string} address - truncated to maximum of `level`, e.g. 'key1:key2'
 */
export function getAddressForLevel (address, level) {
    const keys = getKeysFromAddress(address);
    const newKeys = keys.slice(0, level);
    return getAddressFromKeys(newKeys);
}

//  CHECK
//  ===============================================================================

/**
 * Detects if an address refers to a shader block. In Tangram syntax, six
 * blocks are defined. https://mapzen.com/documentation/tangram/shaders/#blocks
 *
 * A valid shader address will always begin with `styles:` and end in
 * `:shaders:blocks:__block__`, where __block__ is one of the six defined
 * shader blocks.
 *
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if address is a shader block
 */
function isShader (address) {
    const re = /shaders:blocks:(global|width|position|normal|color|filter)$/;
    return _.startsWith(address, 'styles') && re.test(address);
}

/**
 * The following functions are very similar and detects if an address refers to
 * a specific shader block. These are exported as helpers for other modules
 * to use. See documentation for types:
 * https://mapzen.com/documentation/tangram/shaders/#blocks
 *
 * A valid shader address will always begin with `styles:` and end in
 * `:shaders:blocks:__block__`, where __block__ is one of the six defined
 * shader blocks.
 *
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if address is a shader block of that type
 */
export function isGlobalBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:global');
}

export function isWidthBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:width');
}

export function isPositionBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:position');
}

export function isNormalBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:normal');
}

export function isColorBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:color');
}

export function isFilterBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:filter');
}

/**
 * Detects if an address's contents (value) is JavaScript. In Tangram syntax,
 * JavaScript values must be a single function. This makes detection easy:
 * See if the beginning of the string starts with a valid function declaration.
 *
 * @param {Tangram.scene} tangramScene - scene object from Tangram
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if value appears to be a JavaScript function
 */
function isContentJS (tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        const content = getAddressSceneContent(tangramScene, address);

        // Regex pattern. Content can begin with any amount of whitespace.
        // Where whitespace is allowed, it can be any amount of whitespace.
        // Content may begin with a pipe "|" character for YAML multi-line
        // strings. Next, test if "function () {" (with opening brace).
        const re = /^\s*\|?\s*function\s*\(\s*\)\s*\{/m;

        return re.test(content);
    }
    else {
        return false;
    }
}

function isAfterKey (str, pos) {
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
function getKeyAddressFromState (state) {
    if (state.nodes && state.nodes.length > 0) {
        return state.nodes[0].address;
    }
    else {
        return '';
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

// Given a YAML string return an array of keys
// TODO: We will need a different way of parsing YAML flow notation,
// since this function does not cover the full range of legal YAML specification
function getInlineNodes (str, nLine) {
    let rta = [];
    let stack = [];
    let i = 0;
    let level = 0;

    while (i < str.length) {
        let curr = str.substr(i, 1);
        if (curr === '{') {
            // Go one level up
            level++;
        }
        else if (curr === '}') {
            // Go one level down
            stack.pop();
            level--;
        }
        else {
            // check for keypair
            let isNode = /^\s*([\w|\-|_|\$]+)(\s*:\s*)([\w|\-|'|#]*)\s*/gm.exec(str.substr(i));
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
                    // This gets an array starting at index 1. This means that the
                    // result for address will come back as ':key1:key2:etc' because stack[0]
                    // is undefined, but it will still be joined in getAddressFromKeys()
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
export function parseYamlString (string, state, tabSize) {
    const regex = /(^\s*)([\w|\-|_|\/]+)(\s*:\s*)([\w|\W]*)\s*$/gm;
    const node = regex.exec(string);

    // Each node entry is based off of this object.
    // TODO: Also make this available to to getInlineNodes(), above.
    let nodeEntry = {
        address: '',
        key: '',
        anchor: '',
        value: '',
        range: {
            from: {
                line: state.line,
                ch: 0
            },
            to: {
                line: state.line,
                ch: 0
            }
        },
        index: 0
    };

    // If looks like a node
    if (node) {
        const nodeSpaces = node[1];     // Spaces at the beginning of a line
        const nodeKey = node[2];        // the YAML key
        const nodeSeparator = node[3];  // "\s*:\s*"
        const nodeValue = node[4];      // the value, if there is one

        // Calculate the number of spaces and indentation level
        const spaces = (nodeSpaces.match(/\s/g) || []).length;
        const level = Math.floor(spaces / tabSize);

        // Update the node tree
        if (level > state.keyLevel) {
            state.keyStack.push(nodeKey);
        }
        else if (level === state.keyLevel) {
            state.keyStack[level] = nodeKey;
        }
        else if (level < state.keyLevel) {
            let diff = state.keyLevel - level;
            for (let i = 0; i < diff; i++) {
                state.keyStack.pop();
            }
            state.keyStack[level] = nodeKey;
        }

        // Record all that in the state value
        state.keyLevel = level;

        const address = getAddressFromKeys(state.keyStack);
        const fromCh = spaces;
        const toCh = spaces + nodeKey.length + nodeSeparator.length;

        // If there are multiple keys
        if (nodeValue.substr(0, 1) === '{') {
            nodeEntry.address = address;
            nodeEntry.key = nodeKey;
            nodeEntry.range.from.ch = fromCh;
            nodeEntry.range.to.ch = toCh;

            state.nodes = [nodeEntry];

            let subNodes = getInlineNodes(nodeValue, state.line);
            for (let i = 0; i < subNodes.length; i++) {
                subNodes[i].address = address + subNodes[i].address;
                subNodes[i].range.from.ch += spaces + nodeKey.length + nodeSeparator.length;
                subNodes[i].range.to.ch += spaces + nodeKey.length + nodeSeparator.length;
                state.nodes.push(subNodes[i]);
            }
        }
        else {
            const anchor = getAnchorFromValue(nodeValue);

            nodeEntry.address = address;
            nodeEntry.key = nodeKey;
            nodeEntry.anchor = anchor;
            nodeEntry.value = nodeValue.substr(anchor.length);
            nodeEntry.range.from.ch = fromCh;
            nodeEntry.range.to.ch = toCh + nodeValue.length;

            state.nodes = [nodeEntry];
        }
    }
    // Commented or empty lines lines
    else {
        nodeEntry.address = getAddressFromKeys(state.keyStack);
        state.nodes = [nodeEntry];
    }

    return state;
}

// YAML-TANGRAM
// =============================================================================

// Extend YAML with line comment character (not provided by CodeMirror).
CodeMirror.extendMode('yaml', {
    lineComment: '#'
});

CodeMirror.defineMode('yaml-tangram', function (config, parserConfig) {
    // Import multiple modes used by Tangram YAML.
    const yamlMode = CodeMirror.getMode(config, 'yaml');
    const glslMode = CodeMirror.getMode(config, 'glsl');
    const jsMode = CodeMirror.getMode(config, 'javascript');

    function yamlToken (stream, state) {
        const address = getKeyAddressFromState(state);
        if (address !== undefined) {
            if (isShader(address) &&
                !/^\|$/g.test(stream.string) &&
                isAfterKey(stream.string, stream.pos)) {
                state.token = glslToken;
                state.innerMode = glslMode;
                state.innerState = glslMode.startState(getInd(stream.string));
                return glslToken(stream, state);
            }
            else if (isContentJS(tangramScene, address) &&
                        !/^\|$/g.test(stream.string) &&
                        isAfterKey(stream.string, stream.pos)) {
                state.token = jsToken;
                state.innerMode = jsMode;
                state.innerState = jsMode.startState(getInd(stream.string));
                return jsToken(stream, state);
            }
        }

        return yamlMode.token(stream, state);
    }

    function glslToken (stream, state) {
        let address = getKeyAddressFromState(state);
        if (!isShader(address) || (/^\|$/g.test(stream.string))) {
            state.token = yamlToken;
            state.innerState = null;
            state.innerMode = null;
            return yamlMode.token(stream, state);
        }

        return glslMode.token(stream, state.innerState);
    }

    function jsToken (stream, state) {
        let address = getKeyAddressFromState(state);
        if ((!isContentJS(tangramScene, address) || /^\|$/g.test(stream.string))) {
            state.token = yamlToken;
            state.innerState = null;
            state.innerMode = null;
            return yamlMode.token(stream, state);
        }

        return jsMode.token(stream, state.innerState);
    }

    return {
        startState: function () {
            const state = CodeMirror.startState(yamlMode);

            // Augment YAML state object with other information.
            return Object.assign(state, {
                indentation: 0,
                keyStack: [],
                keyLevel: -1,
                line: 0, // 1-indexed line number.
                token: yamlToken,
                // For mixed modes
                innerMode: null,
                innerState: null
            });
        },
        // Makes a safe copy of the original state object.
        copyState: function (originalState) {
            const state = CodeMirror.copyState(yamlMode, originalState);

            // Also, make a safe copy of the inner state object, if present.
            if (originalState.innerState !== null) {
                state.innerState = CodeMirror.copyState(originalState.innerMode, originalState.innerState);
            }

            return state;
        },
        innerMode: function (state) {
            return {
                state: state.innerState || state,
                mode: state.innerMode || yamlMode
            };
        },
        // By default, CodeMirror skips blank lines when tokenizing a document.
        // We need to know the exact line number for our YAML addressing system.
        // CodeMirror allows a blankLine(state) method for languages with significant
        // blank lines, which we use solely to increment the line number on our state
        // object when a blank line is encountered by CodeMirror's parser.
        blankLine: function (state) {
            state.line++;
        },
        token: function (stream, state) {
            // Do the following only once per line
            if (stream.pos === 0) {
                // Parse the string for information - key structure, key name,
                // key level, and address.
                state = parseYamlString(stream.string, state, stream.tabSize);

                // Increment line count in the state, since CodeMirror normally
                // does not keep track of this for us. Note: we may not need
                // this ultimately if widget data is embedded directly on the state.
                state.line++;

                // Record indentation. This is the number of spaces a line
                // is indented. It does not indicate key level, which depends
                // on the indentation level of lines above this one.
                state.indentation = stream.indentation();
            }

            return state.token(stream, state);
        },
        // Enables smart indentation on new lines, while in YAML mode.
        // When the new line is created, if the previous value is blank or
        // the multi-line pipe character, the new line indented one indentUnit
        // past the previous indentation. Otherwise, retain the previous
        // indentation.
        indent: function (state, textAfter) {
            // Indentation in YAML mode
            if (state.innerMode === null) {
                const previousValue = state.nodes[0].value.trim();
                const previousKey = state.nodes[0].key;

                // Only indent after lines that meet certain conditions.
                // The previous line must have a key, and the key's value is
                // either blank or a pipe.
                if (previousKey && (previousValue === '' || previousValue === '|')) {
                    return state.indentation + config.indentUnit;
                }
                else {
                    return state.indentation;
                }
            }
            // If not YAML, defer to inner mode's indent() method.
            // Both JavaScript and C-like modes have built-in indent() methods,
            // so we have no need for fallbacks yet.
            // TODO: there is still buggy implementation of indentation
            // within these inner modes (possibly due to the mixed mode).
            // There is still some work to do.
            else {
                const innerIndent = state.innerMode.indent(state.innerState, textAfter);
                // The inner state's context does not always store the actual
                // indentation, for unknown reasons. This hack never lets the
                // inner mode's indentation be less than the YAML indentation.
                if (innerIndent >= state.indentation) {
                    return innerIndent;
                }
                else {
                    return state.indentation;
                }
            }
        },
        fold: 'indent'
    };
}, 'yaml', 'x-shader/x-fragment');

CodeMirror.defineMIME('text/x-yaml-tangram', 'yaml-tangram');
