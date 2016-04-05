import Widget from './Widget.js';
import Vec3Picker from '../pickers/Vec3Picker';

// When presenting the modal, offset X, Y of the the modal by
// these values, in pixels
const MODAL_X_OFFSET = 0;
const MODAL_Y_OFFSET = 5;

export default class VectorButton extends Widget {

    constructor (...args) {
        super(...args);
    }

    createEl () {
        let el = document.createElement('div');
        el.innerHTML = '<span class="tp-widget-vector-text">+</span>';
        el.className = 'tp-widget tp-widget-vector';
        el.addEventListener('click', this.onClick.bind(this));
        return el;
    }

    onClick (event) {
        let value = this.value;

        // Toggles the picker to be off if it's already present.
        if (this.picker && this.picker.isVisible) {
            this.picker.removeModal();
            return;
        }
        // If no picker is created yet, do it now
        else if (!this.picker) {
            this.picker = new Vec3Picker(value);
        }

        // Turn the picker on and present modal at the desired position
        let pos = this.el.getBoundingClientRect();
        this.picker.presentModal(pos.left + MODAL_X_OFFSET, pos.bottom + MODAL_Y_OFFSET);

        // Note: this fires change events as a live preview of the color.
        // TODO: Store original value so we can go back to it if the
        // interaction is canceled.
        this.picker.on('changed', this.onPickerChange.bind(this));
    }

    onPickerChange (event) {
        event.normalize();
        this.setEditorValue(event.getString('array'));
    }
}
