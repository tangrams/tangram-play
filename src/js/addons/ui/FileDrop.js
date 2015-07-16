'use strict';
// For now: assume globals
/* global tangramPlay */

import EditorIO from './EditorIO.js';

export default class FileDrop {
    constructor (container) {
        this.el = container.getElementsByClassName('tp-filedrop-container')[0];

        // Set up drag/drop file listeners
        container.addEventListener('dragenter', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.show();
        }, true);

        this.el.addEventListener('dragover', (event) => {
            event.preventDefault();
            this.show();
        }, false);

        this.el.addEventListener('dragleave', (event) => {
            event.preventDefault();
            this.hide();
        }, true);

        this.el.addEventListener('drop', (event) => {
            event.preventDefault();
            this.hide();
            onDropFile(event);
        }, false);
    }

    show () {
        this.el.style.display = 'block';
    }

    hide () {
        this.el.style.display = 'none';
    }
}

function onDropFile (event) {
    const dataTransfer = event.dataTransfer;

    if (dataTransfer.files.length > 0) {
        const file = dataTransfer.files[0];
        EditorIO.open(file);
    }
}
