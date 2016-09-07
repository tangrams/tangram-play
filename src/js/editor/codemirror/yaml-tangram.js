import { startsWith } from 'lodash';
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import './glsl-tangram';
import { attachWidgetMarkConstructorsToDocumentState } from './widgets';

const ADDRESS_KEY_DELIMITER = ':';

// GET public functions
// =============================================================================

/**
 * Return a string address from an array of key names
 *
 * @param {Array} keys - an array of keys
 * @return {string} address - in the form of 'key1:key2:key3'
 */
function getAddressFromKeys(keys) {
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
function getKeysFromAddress(address) {
    return address.split(ADDRESS_KEY_DELIMITER);
}

/**
 * Return a string address, truncated to a certain level
 *
 * @param {string} address  - in the form of 'key1:key2:key3'
 * @param {Number} level - the level of address to obtain
 * @return {string} address - truncated to maximum of `level`, e.g. 'key1:key2'
 */
export function getAddressForLevel(address, level) {
    const keys = getKeysFromAddress(address);
    const newKeys = keys.slice(0, level);
    return getAddressFromKeys(newKeys);
}

/**
 * Returns the content given an address
 * If for any reason the content is not found, return an empty string
 *
 * @param {Object} tangramScene - Tangram's parsed object tree of scene content
 * @param {string} address - in the form of 'key1:key2:key3'
 * @return {mixed} content - Whatever is stored as a value for that key
 */
export function getAddressSceneContent(tangramScene, address) {
    try {
        const keys = getKeysFromAddress(address);

        // Looks up content in Tangram's scene.config property.
        // It's a nested object, so to look up from an array of nested keys,
        // we reduce this array down to a single reference.
        // e.g. ['a', 'b', 'c'] looks up content in
        // tangramScene.config['a']['b']['c']
        const content = keys.reduce((obj, property) => obj[property], tangramScene.config);

        return content;
    } catch (error) {
        return '';
    }
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
function isShader(address) {
    const re = /shaders:blocks:(global|width|position|normal|color|filter)$/;
    return startsWith(address, 'styles') && re.test(address);
}

/**
 * Detects if an address's contents (value) is JavaScript. In Tangram syntax,
 * JavaScript values must be a single function. This makes detection easy:
 * See if the beginning of the string starts with a valid function declaration.
 *
 * @param {string} value - the first line of key-value YAML node to check
 *          if it looks like a Javascript function
 * @return {Boolean} bool - `true` if value appears to be a JavaScript function
 * @todo This returns false if any parameters are passed to a function.
 */
function isContentJS(value) {
    // Regex pattern. Content can begin with any amount of whitespace.
    // Where whitespace is allowed, it can be any amount of whitespace.
    // Content may begin with a pipe "|" character for YAML multi-line
    // strings. Next, test if "function () {" (with opening brace).
    const re = /^\s*\|?\s*function\s*\(\s*\)\s*\{/m;

    return re.test(value);
}

function isAfterKey(str, pos) {
    const key = /^\s*(\w+):/gm.exec(str);
    if (key === undefined) {
        return true;
    }

    return [0].length < pos;
}

//  Special Tangram YAML Parser
//  ===============================================================================

//  Get the address of a line state ( usually from the first key of a line )
function getKeyAddressFromState(state) {
    if (state.nodes && state.nodes.length > 0) {
        return state.nodes[0].address;
    }

    return '';
}

function getAnchorFromValue(value) {
    if (/(^\s*(&\w+)\s+)/.test(value)) {
        const link = /(^\s*(&\w+)\s+)/gm.exec(value);
        return link[1];
    }

    return '';
}

// Given a YAML string return an array of keys
// TODO: We will need a different way of parsing YAML flow notation,
// since this function does not cover the full range of legal YAML specification
function getInlineNodes(str, nLine) {
    const rta = [];
    const stack = [];
    let i = 0;
    let level = 0;

    while (i < str.length) {
        const curr = str.substr(i, 1);
        if (curr === '{') {
            // Go one level up
            level++;
        } else if (curr === '}') {
            // Go one level down
            stack.pop();
            level--;
        } else {
            // check for keypair
            // This seems to check for inline nodes
            const isNode = /^\s*([\w|\-|_|\$]+)(\s*:\s*)([\w|\-|'|#]*)\s*/gm.exec(str.substr(i));
            if (isNode) {
                stack[level] = isNode[1];
                i += isNode[1].length;

                const key = isNode[1];
                const colon = isNode[2];
                let value = isNode[3];
                // This regex checks for vec arrays
                // eslint-disable-next-line max-len
                const isVector = str.substr(i + 1 + colon.length).match(/^\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*(,\s*(\d\.|\d*\.?\d+)\s*)?\]/gm);
                if (isVector) {
                    value = isVector[0];
                }
                const anchor = getAnchorFromValue(value);
                value = value.substr(anchor.length);

                rta.push({
                    // This gets an array starting at index 1. This means that the
                    // result for address will come back as ':key1:key2:etc' because stack[0]
                    // is undefined, but it will still be joined in getAddressFromKeys()
                    address: getAddressFromKeys(stack),
                    key,
                    value,
                    anchor,
                    range: {
                        from: {
                            line: nLine,
                            ch: (i + 1) - key.length,
                        },
                        to: {
                            line: nLine,
                            ch: i + colon.length + value.length + 1,
                        },
                    },
                    index: rta.length + 1,
                });
            }
        }
        i++;
    }
    return rta;
}

// Add Address to token states
export function parseYamlString(string, state, tabSize) {
    const regex = /(^\s*)([\w|\-|_|\/]+)(\s*:\s*)([\w|\W]*)\s*$/gm;
    const node = regex.exec(string);

    // Each node entry is based off of this object.
    // TODO: Also make this available to to getInlineNodes(), above.
    const nodeEntry = {
        address: '',
        key: '',
        anchor: '',
        value: '',
        range: {
            from: {
                line: state.line,
                ch: 0,
            },
            to: {
                line: state.line,
                ch: 0,
            },
        },
        index: 0,
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
        } else if (level === state.keyLevel) {
            state.keyStack[level] = nodeKey;
        } else if (level < state.keyLevel) {
            const diff = state.keyLevel - level;
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

            const subNodes = getInlineNodes(nodeValue, state.line);
            for (let i = 0; i < subNodes.length; i++) {
                subNodes[i].address = address + subNodes[i].address;
                subNodes[i].range.from.ch += spaces + nodeKey.length + nodeSeparator.length;
                subNodes[i].range.to.ch += spaces + nodeKey.length + nodeSeparator.length;
                state.nodes.push(subNodes[i]);
            }
        } else {
            const anchor = getAnchorFromValue(nodeValue);

            nodeEntry.address = address;
            nodeEntry.key = nodeKey;
            nodeEntry.anchor = anchor;
            nodeEntry.value = nodeValue.substr(anchor.length);
            nodeEntry.range.from.ch = fromCh;
            nodeEntry.range.to.ch = toCh + nodeValue.length;

            state.nodes = [nodeEntry];
        }
    } else {
        // Commented or empty lines
        nodeEntry.address = getAddressFromKeys(state.keyStack);
        state.nodes = [nodeEntry];
    }

    // Adds widgets to nodes, if they have them.
    state = attachWidgetMarkConstructorsToDocumentState(state);

    return state;
}

// YAML-TANGRAM
// =============================================================================

// Extend YAML with line comment character (not provided by CodeMirror).
CodeMirror.extendMode('yaml', {
    lineComment: '#',
});

CodeMirror.defineMode('yaml-tangram', (config, parserConfig) => {
    // Import multiple modes used by Tangram YAML.
    const yamlMode = CodeMirror.getMode(config, 'yaml');
    const glslMode = CodeMirror.getMode(config, 'glsl');
    const jsMode = CodeMirror.getMode(config, 'javascript');

    return {
        startState() {
            const state = CodeMirror.startState(yamlMode);

            // Augment YAML state object with other information.
            return Object.assign(state, {
                indentation: 0,
                keyStack: [],
                keyLevel: -1,
                line: -1, // 0-indexed line number.
                string: '',
                nodes: [],
                // For mixed modes
                innerMode: null,
                innerState: null,
                shouldChangeInnerMode: false,
                singleLineInnerMode: false,
                parentBlockIndent: 0,
            });
        },
        // Makes a safe copy of the original state object.
        copyState(originalState) {
            const state = CodeMirror.copyState(yamlMode, originalState);

            // Also, make a safe copy of the inner state object, if present.
            if (originalState.innerState !== null) {
                state.innerState = CodeMirror.copyState(originalState.innerMode, originalState.innerState);
            }

            return state;
        },
        innerMode(state) {
            return {
                state: state.innerState || state,
                mode: state.innerMode || yamlMode,
            };
        },
        // By default, CodeMirror skips blank lines when tokenizing a document.
        // This updates the state for blank lines.
        blankLine(state) {
            state.string = '';

            // We need to know the exact line number for our YAML addressing system.
            // Increment blank lines here.
            state.line++;

            // We also need to set the indentation to zero so that smart
            // indentation does not try to pick up indentation from a previous
            // line that is not blank.
            state.indentation = 0;
        },
        token(stream, state) {
            const address = getKeyAddressFromState(state);

            if (stream.pos === 0) {
                // Record indentation. This is the number of spaces a line
                // is indented. It does not indicate key level, which depends
                // on the indentation level of lines above this one.
                // If we're about to change inner modes, record the previous
                // line indent as the parent block's indentation level.
                // We will use this indentation as a way to know if we drop out
                // of the inner mode.
                if (state.shouldChangeInnerMode) {
                    state.parentBlockIndent = state.indentation;
                }
                state.indentation = stream.indentation();
                state.string = stream.string;

                // If we think we're in an inner mode, but the indentation level
                // of this stream has dropped down to, or less than the inner
                // mode's opening indentation, then cancel & reset inner modes.
                // Furthermore, return from the tokenizer without advancing the
                // stream.
                if (state.innerMode && state.indentation <= state.parentBlockIndent) {
                    state.innerMode = null;
                    state.innerState = null;
                    return null;
                }

                // Increment line count in the state, since CodeMirror normally
                // does not keep track of this for us. Note: we may not need
                // this ultimately if widget data is embedded directly on the state.
                state.line++;
            }

            // Do the following only once per line
            if (stream.sol()) {
                // Parse the string for information - key structure, key name,
                // key level, and address.
                state = parseYamlString(stream.string, state, stream.tabSize);

                // If we should change mode here, and there is already not an
                // inner mode, determine what mode to switch to.
                if (state.shouldChangeInnerMode && !state.innerMode && address !== undefined) {
                    if (isShader(address)) {
                        state.innerMode = glslMode;
                    } else if (isContentJS(state.string)) {
                        state.innerMode = jsMode;
                    }

                    // Reset this.
                    state.shouldChangeInnerMode = false;
                }
            }

            // If we are parsing a value, determine what language to parse in.
            if (address !== undefined && isAfterKey(stream.string, stream.pos)) {
                const value = state.nodes[0].value.trim();

                // If it's a multiline indicator, we will begin changing modes
                // in the next stream, instead of right now.
                if (value === '|') {
                    state.shouldChangeInnerMode = true;
                } else if (isShader(address)) {
                    // Otherwise, start inner modes immediately.
                    state.innerMode = glslMode;
                } else if (isContentJS(value)) {
                    // This inner mode is assumed to be on one line only, so
                    // we need to make them active only for the current line.
                    state.innerMode = jsMode;
                    state.singleLineInnerMode = true;
                }
            }

            // Get the token, according to either the inner mode or YAML mode.
            let token;

            if (state.innerMode) {
                const innerMode = state.innerMode;
                state.innerState = innerMode.startState();
                token = innerMode.token(stream, state.innerState);
            } else {
                token = yamlMode.token(stream, state);
            }

            // Actions to perform at the end of the stream.
            if (stream.eol()) {
                // If an inner mode is activated, but for one line only, then
                // we want to reset the innermode and inner state at the end
                // of the line.
                if (state.singleLineInnerMode === true) {
                    state.innerMode = null;
                    state.innerState = null;
                    state.singleLineInnerMode = false;
                }
            }

            return token;
        },
        // Enables smart indentation on new lines, while in YAML mode.
        // When the new line is created, if the previous value is blank or
        // the multi-line pipe character, the new line indented one indentUnit
        // past the previous indentation. Otherwise, retain the previous
        // indentation.
        indent(state, textAfter) {
            // Indentation in YAML mode
            if (state.innerMode === null) {
                const node = state.nodes[0] || null;

                if (!node) {
                    return state.indentation;
                }

                const previousValue = node.value.trim();
                const previousKey = node.key;

                // Only indent after lines that meet certain conditions.
                // The previous line must have a key, and the key's value is
                // either blank or a pipe.
                if (previousKey && (previousValue === '' || previousValue === '|')) {
                    return state.indentation + config.indentUnit;
                }

                return state.indentation;
            }

            // If not YAML, defer to inner mode's indent() method.
            // Both JavaScript and C-like modes have built-in indent() methods,
            // so we have no need for fallbacks yet.
            const innerIndent = state.innerMode.indent(state.innerState, textAfter);
            return state.indentation + innerIndent;
        },
        fold: 'indent',
    };
}, 'yaml', 'x-shader/x-fragment');

CodeMirror.defineMIME('text/x-yaml-tangram', 'yaml-tangram');
