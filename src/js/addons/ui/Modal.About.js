'use strict';

import { container } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';
import CodeMirror from 'codemirror';

let modalEl;

export default class AboutModal extends Modal {
    constructor () {
        super();
        this.el = modalEl = container.querySelector('.tp-about-modal');

        // Get and display version numbers.
        // Tangram version comes with its own "v"
        modalEl.querySelector('.about-tangram-version').textContent = window.Tangram.version;
        // Add "v" for Leaflet and CodeMirror
        modalEl.querySelector('.about-leaflet-version').textContent = `v${window.L.version}`;
        modalEl.querySelector('.about-cm-version').textContent = `v${CodeMirror.version}`;
    }
}
