'use strict';

import { container } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';
import EditorIO from 'app/addons/ui/EditorIO';

let modalEl;

export default class OpenUrlModal extends Modal {
    constructor () {
        super();

        this.el = modalEl = container.querySelector('.tp-open-url-modal');
        this.message = 'Open a style from URL';
        this.input = this.el.querySelector('.tp-open-url-input input');
        this.input.addEventListener('keyup', (event) => {
            if (this.input.value) {
                this.el.querySelector('.tp-modal-confirm').disabled = false;
                let key = event.keyCode || event.which;
                if (key === 13) {
                    this._handleConfirm();
                }
            }
            else {
                this.el.querySelector('.tp-modal-confirm').disabled = true;
            }
        });
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
            this.input.focus();
        });
    }

    clearInput () {
        this.input.value = '';
        this.input.blur();
        this.el.querySelector('.tp-modal-confirm').disabled = true;
    }

    _handleConfirm () {
        const value = this.input.value;
        this.clearInput();
        EditorIO.loadContentFromPath(value);
        super._handleConfirm();
    }

    _handleAbort () {
        this.clearInput();
        super._handleAbort();
    }
}
