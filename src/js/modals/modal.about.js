import Modal from './modal';
import CodeMirror from 'codemirror';
import L from 'leaflet';

class AboutModal extends Modal {
    constructor () {
        super();
        this.el = document.body.querySelector('.about-modal');

        // Get and display version numbers.
        // Tangram version comes with its own "v"
        this.el.querySelector('.about-tangram-version').textContent = window.Tangram.version;
        // Add "v" for Leaflet and CodeMirror
        this.el.querySelector('.about-leaflet-version').textContent = `v${L.version}`;
        this.el.querySelector('.about-cm-version').textContent = `v${CodeMirror.version}`;
    }
}

export const aboutModal = new AboutModal();
