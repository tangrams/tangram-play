'use strict';

import Modal from './Modal.js';

export default class FileDrop {
    constructor (container = document) {
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

        // TODO: Pass the file contents to some other
        // module that handles open/save/cancel logic
        checkEditorSaveStateThenDoStuff(function () {
            openContent(file);
        })
    }
}

// TODO HACK
// CURRENTLY JUST DUPLICATING STANDALONE FUNCTIONS FROM MENU.JS
function checkEditorSaveStateThenDoStuff (callback) {
    if (editor && editor.isSaved === false) {
        let unsavedModal = new Modal(tangramPlay, 'Your style has not been saved. Continue?', callback);
        unsavedModal.show();
    } else {
        callback();
    }
}

function openContent (content) {
    let reader = new FileReader();
    reader.onload = function(e) {
        tangramPlay.loadContent( e.target.result );
    }
    reader.readAsText(content);
}

