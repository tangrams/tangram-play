'use strict';

import { container } from 'app/TangramPlay';
import Shield from 'app/addons/ui/Shield';
import { noop } from 'app/addons/ui/Helpers';

export default class Modal {
    constructor (message = 'Dude.', callback = noop, abort = noop) {
        this.el = container.querySelector('.tp-modal');
        this.message = message;
        this.callback = callback;
        this.abort = abort;

        this.shield = new Shield();

        // Setup proper "this" binding to these callback functions
        // This is necessary so that these functions have the proper
        // "this" scope of this class
        // Setting it here (instead of an arrow function or a .bind(this))
        // allows removeEventListener to remove this via the correct
        // reference later. We are reusing these DOM elements so it is
        // important to remove the callbacks, otherwise multiple
        // callbacks remain attached to the buttons, which is not great.
        this._handleConfirm = this._handleConfirm.bind(this);
        this._handleAbort = this._handleAbort.bind(this);
    }

    get message () {
        return this.el.querySelector('.tp-modal-text').textContent;
    }

    set message (value) {
        this.el.querySelector('.tp-modal-text').textContent = value;
    }

    show () {
        this.shield.show();
        this.el.style.display = 'block';

        this.confirmButton = this.el.querySelector('.tp-modal-confirm');
        this.cancelButton = this.el.querySelector('.tp-modal-cancel');

        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', this._handleConfirm, false);
        }

        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this._handleAbort, false);
        }

        container.addEventListener('keydown', this._handleEsc.bind(this), false);
    }

    hide () {
        this.shield.hide();
        this.el.style.display = 'none';

        if (this.confirmButton) {
            this.confirmButton.removeEventListener('click', this._handleConfirm, false);
        }

        if (this.cancelButton) {
            this.cancelButton.removeEventListener('click', this._handleAbort, false);
        }

        container.removeEventListener('keydown', this._handleEsc.bind(this), false);
    }

    // Pass through events to callbacks
    _handleConfirm (event) {
        this.hide();
        this.callback(event);
    }

    _handleAbort (event) {
        this.hide();
        this.abort(event);
    }

    // Listen for escape key, which functions the same as hide & abort
    // Events are passed through to the abort callback as well.
    _handleEsc (event) {
        let key = event.keyCode || event.which;
        if (key === 27) {
            this.hide();
            this.abort(event);
        }
    }
}
