'use strict';

import TangramPlay from 'app/TangramPlay';

export default class ErrorsManager {
    constructor() {
        //  private variables
        this.widgets = [];
        this.block_errors = new Set();

        // EVENTS
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            TangramPlay.addons.errorsManager.clean();
        });

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
        if (this.widgets.length > 0) {
            for (let i = 0; i < this.widgets.length; i++) {
                TangramPlay.editor.removeLineWidget(this.widgets[i]);
            }
            this.widgets.length = 0;
            this.block_errors.clear();
        }
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
                if (this.block_errors.has(JSON.stringify(block))) {
                    continue;
                }
                this.block_errors.add(JSON.stringify(block));

                let address = '/styles/' + style + '/shaders/blocks/';
                let nLine = TangramPlay.getKeyForAddress(address + block.name).pos.line + 1 + block.line;

                let msg = document.createElement('div');
                let icon = msg.appendChild(document.createElement('span'));
                icon.className = 'btm bt-exclamation-circle tp-warning-icon';
                msg.appendChild(document.createTextNode(errors[i].message));
                msg.className = 'tp-warning';
                this.widgets.push(TangramPlay.editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
            }
        }
    }
}
