'use strict';

import { container } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';
import CodeMirror from 'codemirror';

const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';

export default class SaveGistModal extends Modal {
    constructor () {
        super();
        this.el = container.querySelector('.tp-save-gist-modal');
        this.descInput = this.el.querySelector('#gist-description');
        this.descInput.value = DEFAULT_GIST_DESCRIPTION;
        this.privateInput = this.el.querySelector('#gist-private');
    }

    resetInputs () {
        this.descInput.value = DEFAULT_GIST_DESCRIPTION;
        this.descInput.blur();
        this.privateInput.value = false;
        this.privateInput.blur();
        this.el.querySelector('.tp-modal-confirm').removeAttribute('disabled');
        this.el.querySelector('.tp-modal-cancel').removeAttribute('disabled');
        this.el.querySelector('.tp-modal-thinking').classList.remove('tp-modal-thinking-cap-on');
    }

    _handleConfirm () {
        const description = this.descInput.value;
        this.el.querySelector('.tp-modal-thinking').classList.add('tp-modal-thinking-cap-on');
        this.el.querySelector('.tp-modal-confirm').disabled = true;
        this.el.querySelector('.tp-modal-cancel').disabled = true;
        //this.resetInputs();
        // super._handleConfirm();
    }

    _handleAbort () {
        this.resetInputs();
        super._handleAbort();
    }
    //     .tp-modal-thinking-cap-on
}
