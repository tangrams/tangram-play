import { editor, getNodesForAddress } from './editor';
import { tangramLayer } from '../map/map';
import { EventEmitter } from '../components/event-emitter';

const lineWidgets = [];
const blockErrors = new Set();

export function initErrorsManager() {
    editor.on('changes', (cm, changesObjs) => {
        clearAllErrors();
    });

    // Subscribe to error events from Tangram
    EventEmitter.subscribe('tangram:sceneinit', () => {
        tangramLayer.scene.subscribe({
            error: (args) => {
                addError(args);
            },
            warning: (args) => {
                addWarning(args);
            },
        });
    });
}

function clearAllErrors() {
    for (let i = 0; i < lineWidgets.length; i++) {
        editor.removeLineWidget(lineWidgets[i]);
    }
    lineWidgets.length = 0;
    blockErrors.clear();
}

function addError(args) {
    if (args.type !== undefined) {
        const msg = document.createElement('div');
        const icon = msg.appendChild(document.createElement('span'));
        icon.className = 'btm bt-exclamation-triangle error-icon';
        msg.appendChild(document.createTextNode(args.error.reason));
        msg.className = 'error';
        lineWidgets.push(editor.addLineWidget(args.error.mark.line, msg, { coverGutter: false, noHScroll: true }));
    }
}

function addWarning(args) {
    if (args.type === 'styles') {
        // Only show first error, cascading errors can be confusing
        const errors = args['shader_errors'].slice(0, 1);

        for (let i = 0; i < errors.length; i++) {
            const style = errors[i].block.scope;

            // Skip generic errors not originating in style-sheet
            if (style === 'ShaderProgram') {
                continue;
            }

            const block = errors[i].block;

            // De-dupe errors per block
            if (blockErrors.has(JSON.stringify(block))) {
                continue;
            }

            const address = `styles:${style}:shaders:blocks:${block.name}`;
            const node = getNodesForAddress(address);

            if (node) {
                const nLine = node.range.from.line + 1 + block.line;

                const msg = document.createElement('div');
                const icon = msg.appendChild(document.createElement('span'));
                icon.className = 'btm bt-exclamation-circle warning-icon';
                msg.appendChild(document.createTextNode(errors[i].message));
                msg.className = 'warning';
                lineWidgets.push(editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
                blockErrors.add(JSON.stringify(block)); // track unique errors
            }
            else {
                console.log('Node', address, 'was not found');
            }
        }
    }
    else if (args.type === 'duplicate') {
        for (const node of args.nodes) {
            console.log(node);
            const nLine = node.widget.range.to.line + 1;
            const msg = document.createElement('div');
            const icon = msg.appendChild(document.createElement('span'));
            icon.className = 'btm bt-exclamation-circle warning-icon';
            msg.appendChild(document.createTextNode(`Duplicate key ${node.key} (${node.address})`));
            msg.className = 'warning';
            lineWidgets.push(editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
        }
    }
}
