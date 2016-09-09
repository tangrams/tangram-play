import { editor, getNodesForAddress } from './editor';
import { tangramLayer } from '../map/map';
import EventEmitter from '../components/event-emitter';

const lineWidgets = [];
const blockErrors = new Set();

/**
 * Creates DOM element to be injected into the editor and display as an error.
 *
 * @param {string} type - either 'error' or 'warning'
 * @param {string} message - the string to display in the error
 */
function createErrorLineElement(type, message) {
    let iconTypeClass;
    if (type === 'error') {
        iconTypeClass = 'btm bt-exclamation-triangle error-icon';
    } else if (type === 'warning') {
        iconTypeClass = 'btm bt-exclamation-circle warning-icon';
    }

    const node = document.createElement('div');
    node.className = type;

    const icon = document.createElement('span');
    icon.className = iconTypeClass;

    node.appendChild(icon);
    node.appendChild(document.createTextNode(message));

    return node;
}

/**
 * Creates CodeMirror line widget to display an error below a line.
 *
 * @param {string} type - either 'error' or 'warning'
 * @param {Number} line - the line number to display under
 * @param {string} message - the string to display in the error
 */
function createLineWidget(type, line, message) {
    const node = createErrorLineElement(type, message);
    const lineWidget = editor.addLineWidget(line, node, {
        coverGutter: false,
        noHScroll: true,
    });

    lineWidgets.push(lineWidget);
}

function clearAllErrors() {
    for (let i = 0; i < lineWidgets.length; i++) {
        editor.removeLineWidget(lineWidgets[i]);
    }
    lineWidgets.length = 0;
    blockErrors.clear();
}

/**
 * Handles error object returned by Tangram's error event.
 *
 * @param {Object} errorObj - error object from Tangram. Its signature will
 *          vary depending on the `errorObj.type` property.
 */
function addError(errorObj) {
    switch (errorObj.type) {
        case 'yaml': {
            const line = errorObj.error.mark.line;
            const message = errorObj.error.reason;
            createLineWidget('error', line, message);
            break;
        }
        // case 'scene':
        case 'scene_import':
            // errorObj contains these properties:
            //      `message` - handy error from Tangram
            //      `url` - the url that could not be loaded
            // Unfortunately we do not have a line number on which the error exists
            console.log(errorObj.message, errorObj.url);
            break;
        // Default case handles unknown error types or undefined types, which
        // can happen if Tangram Play itself (and not Tangram) throws an error
        // when Tangram is executing a Promise and catches a Tangram Play error.
        default:
            console.log('unknown error', errorObj);
            break;
    }
}

function addWarning(errorObj) {
    switch (errorObj.type) {
        case 'styles': {
            // Only show first error, cascading errors can be confusing
            const errors = errorObj.shader_errors.slice(0, 1);

            for (let i = 0; i < errors.length; i++) {
                const style = errors[i].block.scope;

                // Skip generic errors not originating in style-sheet
                if (style === 'ShaderProgram') {
                    continue; // eslint-disable-line no-continue
                }

                const block = errors[i].block;

                // De-dupe errors per block
                if (blockErrors.has(JSON.stringify(block))) {
                    continue; // eslint-disable-line no-continue
                }

                const address = `styles:${style}:shaders:blocks:${block.name}`;
                const node = getNodesForAddress(address);

                if (node) {
                    const line = node.range.from.line + 1 + block.line;
                    const message = errors[i].message;
                    createLineWidget('warning', line, message);
                    blockErrors.add(JSON.stringify(block)); // track unique errors
                } else {
                    // TODO: Report a general level error
                    console.log('Node', address, 'was not found');
                }
            }

            break;
        }
        // Handle unknown warning types.
        default:
            break;
    }
}

export function initErrorsManager() {
    editor.on('changes', (cm, changesObjs) => {
        clearAllErrors();
    });

    // Subscribe to error events from Tangram
    // See documentation: https://mapzen.com/documentation/tangram/Javascript-API/#error-and-warning
    EventEmitter.subscribe('tangram:sceneinit', () => {
        tangramLayer.scene.subscribe({
            error: (event) => {
                addError(event);
            },
            warning: (event) => {
                addWarning(event);
            },
        });
    });
}
