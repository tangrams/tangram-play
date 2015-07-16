'use strict';
// For now: assume globals
/* global tangramPlay */

import Shield from './Shield.js';
import { noop } from './Helpers.js';

export default class Modal {
    constructor (message = 'Dude.', callback = noop, abort = noop) {
        const container = tangramPlay.container;

        this.el = container.querySelector('.tp-modal');
        this.message = message;
        this.callback = callback;
        this.abort = abort;

        this.shield = new Shield(container);

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
        this.el.querySelector('.tp-modal-confirm').addEventListener('click', this._handleConfirm, false);
        this.el.querySelector('.tp-modal-cancel').addEventListener('click', this._handleAbort, false);
    }

    hide () {
        this.shield.hide();
        this.el.style.display = 'none';
        this.el.querySelector('.tp-modal-confirm').removeEventListener('click', this._handleConfirm, false);
        this.el.querySelector('.tp-modal-cancel').removeEventListener('click', this._handleAbort, false);
    }

    _handleConfirm () {
        this.hide();
        this.callback();
    }

    _handleAbort () {
        this.hide();
        this.abort();
    }
}
