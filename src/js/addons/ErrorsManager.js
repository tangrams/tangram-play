'use strict';

import TangramPlay from 'app/TangramPlay';

export default class ErrorsManager {
    constructor() {
        //  private variables
        this.widgets = [];
        this.blockErrors = new Set();

        // EVENTS
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            TangramPlay.addons.errorsManager.clean();
        });

        // TODO
        // Make this rely on promises
        if (TangramPlay.map.layer) {
            this.subscribeToTangramEvents();
        }
        else {
            TangramPlay.on('sceneinit', () => {
                this.subscribeToTangramEvents();
            })
        }
    }

    subscribeToTangramEvents () {
        TangramPlay.map.layer.scene.subscribe({
            error: (args) => {
                this.addError(args);
            },
            warning: (args) => {
                this.addWarning(args);
            }
        });
    }

    clean() {
        for (let i = 0; i < this.widgets.length; i++) {
            TangramPlay.editor.removeLineWidget(this.widgets[i]);
        }
        this.widgets.length = 0;
        this.blockErrors.clear();
    }

    addError(args) {
        if (args.type !== undefined) {
            let msg = document.createElement('div');
            let icon = msg.appendChild(document.createElement('span'));
            icon.className = 'btm bt-exclamation-triangle tp-error-icon';
            msg.appendChild(document.createTextNode(args.error.reason));
            msg.className = 'tp-error';
            this.widgets.push(TangramPlay.editor.addLineWidget(args.error.mark.line, msg, { coverGutter: false, noHScroll: true }));
        }
    }

    addWarning(args) {
        if (args.type === 'styles') {
            // Only show first error, cascading errors can be confusing
            let errors = args['shader_errors'].slice(0, 1);

            for (let i = 0; i < errors.length; i++) {
                let style = errors[i].block.scope;

                // Skip generic errors not originating in style-sheet
                if (style === 'ShaderProgram') {
                    continue;
                }

                let block = errors[i].block;

                // De-dupe errors per block
                if (this.blockErrors.has(JSON.stringify(block))) {
                    continue;
                }

                let address = '/styles/' + style + '/shaders/blocks/';
                let node = TangramPlay.getNodesForAddress(address + block.name);

                if (node) {
                    let nLine = node.range.from.line + 1 + block.line;

                    let msg = document.createElement('div');
                    let icon = msg.appendChild(document.createElement('span'));
                    icon.className = 'btm bt-exclamation-circle tp-warning-icon';
                    msg.appendChild(document.createTextNode(errors[i].message));
                    msg.className = 'tp-warning';
                    this.widgets.push(TangramPlay.editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
                    this.blockErrors.add(JSON.stringify(block)); // track unique errors
                }
                else {
                    console.log('Node', address + block.name, 'was not found');
                }
            }
        } else if (args.type === 'duplicate') {
            for (let node of args['nodes']){
                console.log(node);
                let nLine = node.widget.range.to.line + 1;
                let msg = document.createElement('div');
                let icon = msg.appendChild(document.createElement('span'));
                icon.className = 'btm bt-exclamation-circle tp-warning-icon';
                msg.appendChild(document.createTextNode("Duplicate key " + node.key + " (" + node.address + ")" ));
                msg.className = 'tp-warning';
                this.widgets.push(TangramPlay.editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
            }
        }
    }
}
