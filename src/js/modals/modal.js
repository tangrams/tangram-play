import _ from 'lodash';
import shield from '../ui/shield';

export default class Modal {
    constructor (message, confirm = _.noop, abort = _.noop, options = {}) {
        // Set up options
        this.options = options;
        // this.options.disableEsc = false;

        // Modal element to use
        this.el = (this.options.el) ? this.options.el : document.body.querySelector('.modal');

        this.message = message;

        // Set callback methods
        this.onConfirm = confirm;
        this.onAbort = abort;

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
        this._handleEsc = this._handleEsc.bind(this);
    }

    get message () {
        return this.el.querySelector('.modal-text').textContent;
    }

    set message (value) {
        this.el.querySelector('.modal-text').textContent = value;
    }

    // Shows modal and attaches events.
    show () {
        shield.show();
        this.el.style.display = 'block';

        this.confirmButton = this.el.querySelector('.modal-confirm');
        this.cancelButton = this.el.querySelector('.modal-cancel');

        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', this._handleConfirm, false);
        }

        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this._handleAbort, false);
        }

        // Add the listener for the escape key
        window.addEventListener('keydown', this._handleEsc, false);
    }

    // Hides modal and resets events
    hide () {
        shield.hide();
        this.el.style.display = 'none';

        if (this.confirmButton) {
            this.confirmButton.removeEventListener('click', this._handleConfirm, false);
        }

        if (this.cancelButton) {
            this.cancelButton.removeEventListener('click', this._handleAbort, false);
        }

        window.removeEventListener('keydown', this._handleEsc, false);
    }

    // Pass through events to callbacks
    _handleConfirm (event) {
        this.hide();
        this.onConfirm(event);
    }

    _handleAbort (event) {
        this.hide();
        this.onAbort(event);
    }

    // Function to handle when the escape key is pressed.
    // Does the same thing as if you pressed the Cancel button.
    // Events are passed through to the abort callback as well.
    _handleEsc (event) {
        let key = event.keyCode || event.which;
        if (key === 27 && !this.options.disableEsc) {
            this._handleAbort(event);
        }
    }
}
