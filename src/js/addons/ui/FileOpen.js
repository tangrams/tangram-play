'use strict';

import EditorIO from './EditorIO.js';

export default class FileOpen {
    constructor (container) {
        this.el = constructInvisibleFileInputElement();
        container.appendChild(this.el);
    }

    activate () {
        const input = this.el;
        EditorIO.checkSaveStateThen(() => {
            input.click();
        })
    }
}

function constructInvisibleFileInputElement () {
    let fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', 'text/x-yaml');
    fileSelector.style.display = 'none';
    fileSelector.addEventListener('change', function (event) {
        const files = event.target.files;
        EditorIO.open(files[0]);
    });
    return fileSelector;
}
