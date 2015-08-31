'use strict';

import TangramPlay from '../TangramPlay.js';

export default class ErrorsManager {
    constructor() {
        //  private variables
        this.widgets = [];

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

            // Temporal Fix, consider WidgetManager to admin line widgtets
            TangramPlay.addons.widgetsManager.update();
        }
    }

    addError(args) {
        if (args.type !== undefined) {
            let msg = document.createElement('div');
            let icon = msg.appendChild(document.createElement('span'));
            icon.innerHTML = 'X';
            icon.className = 'tp-error-icon';
            msg.appendChild(document.createTextNode(args.error.reason));
            msg.className = 'tp-error';
            this.widgets.push(TangramPlay.editor.addLineWidget(args.error.mark.line, msg, { coverGutter: false, noHScroll: true }));

            // Temporal Fix, consider WidgetManager to admin line widgtets
            TangramPlay.addons.widgetsManager.update();
        }
    }

    addWarning(args) {
        if (args.type === 'styles') {
            let address = '/styles/' + args.style.name + '/shaders/blocks/';
            let errors = args['shader_errors'];

            for (let i = 0; i < errors.length; i++) {
                let nLine = TangramPlay.getKeyForAddress(address + errors[i].block.name).pos.line + 1 + errors[i].block.line;

                let msg = document.createElement('div');
                let icon = msg.appendChild(document.createElement('span'));
                icon.innerHTML = '!!';
                icon.className = 'tp-warning-icon';
                msg.appendChild(document.createTextNode(errors[i].message));
                msg.className = 'tp-warning';
                this.widgets.push(TangramPlay.editor.addLineWidget(nLine, msg, { coverGutter: false, noHScroll: true }));
            }

            // Temporal Fix, consider WidgetManager to admin line widgtets
            TangramPlay.addons.widgetsManager.update();
        }
    }
}
