'use strict';

import TangramPlay from '../TangramPlay.js';

export default class ErrorsManager {
    constructor() {

        //  private variables
        this.widgets = []

        // EVENTS
        TangramPlay.editor.on('changes', (cm, changesObjs) => {
            TangramPlay.addons.errorsManager.clean();
        });

        TangramPlay.map.layer.scene.subscribe({
            // load: function (args) {
            //     console.log('scene loaded!');
            // },
            error: function (args) {
                TangramPlay.addons.errorsManager.addError(args);
            },
            warning: function (args) {
                TangramPlay.addons.errorsManager.addWarning(args);
            }
        });
    }

    clean() {
        for (let i = 0; i < this.widgets.length; i++){
            TangramPlay.editor.removeLineWidget(this.widgets[i]);
        }
        this.widgets.length = 0;
    }

    addError(args) {
        console.log(args);
        let msg = document.createElement('div');
        let icon = msg.appendChild(document.createElement('span'));
        icon.innerHTML = 'x';
        icon.className = 'tp-error-icon';
        msg.appendChild(document.createTextNode(args.error.reason));
        msg.className = 'tp-error';
        this.widgets.push(TangramPlay.editor.addLineWidget(args.error.mark.line, msg, { coverGutter: false, noHScroll: true }));
    }

    addWarning(args) {
        console.log(args);
        console.log(args.error.getStack());
        // let msg = document.createElement('div');
        // let icon = msg.appendChild(document.createElement('span'));
        // icon.innerHTML = '!';
        // icon.className = 'tp-warning-icon';
        // msg.appendChild(document.createTextNode(args.error.reason));
        // msg.className = 'tp-warning';
        // this.widgets.push(TangramPlay.editor.addLineWidget(args.error.mark.line, msg, { coverGutter: false, noHScroll: true }));
    }
}