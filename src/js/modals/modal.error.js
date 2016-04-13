import Modal from './modal';

export default class ErrorModal extends Modal {
    constructor (error, confirm, abort) {
        // Error message might be an Error object or a string
        const text = error.message || error;

        super(text, confirm, abort, {
            el: document.body.querySelector('.error-modal')
        });
    }

    /**
     * On show, focus on the confirm button for this modal.
     * TODO: Consider whether this should be default behavior for modals.
     */
    show () {
        super.show();
        this.el.querySelector('.modal-confirm').focus();
    }
}
