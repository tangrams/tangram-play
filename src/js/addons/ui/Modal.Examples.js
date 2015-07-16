'use strict';
// For now: assume globals
/* global tangramPlay */

import Modal from './Modal.js';
import EditorIO from './EditorIO.js';
import { fetchHTTP } from '../../core/common.js';

let examplesEl;

export default class ExamplesModal extends Modal {
    constructor (configFile) {
        super();

        // TODO
        const container = (typeof tangramPlay !== 'undefined') ? tangramPlay.container : document;

        this.el = examplesEl = container.querySelector('.tp-example-modal');
        this.message = 'Choose an example to open';
        loadExamples(configFile);
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
        });
    }

    _handleConfirm () {
        const selected = this.el.querySelectorAll('.tp-example-option.tp-example-selected')[0];
        const value = selected.getAttribute('data-value');
        openExample(value);
        super._handleConfirm()
    }

    _handleAbort () {
        resetExampleSelection();
        this.el.querySelector('.tp-modal-confirm').disabled = true;
        super._handleAbort()
    }
}

// TODO: Refactor
function loadExamples (configFile) {
    const data = JSON.parse(fetchHTTP(configFile));
    const listEl = examplesEl.querySelector('.tp-example-list');

    for (let example of data['examples']) {
        let newOption = document.createElement('div');
        let nameEl = document.createElement('div');
        let name = example['name'].split('.')[0];
        let thumbnailEl = document.createElement('div');
        newOption.className = 'tp-example-option';
        newOption.setAttribute('data-value', example['url']);
        nameEl.className = 'tp-example-option-name';
        nameEl.textContent = name.replace(/-/g, ' ');
        thumbnailEl.className = 'tp-example-thumbnail';
        thumbnailEl.style.backgroundColor = 'rgba(255,255,255,0.05)';
        thumbnailEl.style.backgroundImage = 'url(https://cdn.rawgit.com/tangrams/tangram-sandbox/gh-pages/styles/' + name + '.png)';
        newOption.appendChild(nameEl);
        newOption.appendChild(thumbnailEl);
        newOption.addEventListener('click', selectExample);
        listEl.appendChild(newOption);
    }
}

function selectExample (event) {
    let target = event.target;
    while (!target.classList.contains('tp-example-option')) {
        target = target.parentNode;
    }
    resetExampleSelection();
    target.classList.add('tp-example-selected');
    examplesEl.querySelector('.tp-modal-confirm').disabled = false;
}

function resetExampleSelection () {
    const allExamples = examplesEl.querySelectorAll('.tp-example-option');
    for (let example of allExamples) {
        example.classList.remove('tp-example-selected');
    }
}

function openExample (value) {
    window.history.pushState({
        loadStyleURL: value
    }, null, '.?style=' + value + window.location.hash);
    tangramPlay.loadQuery();
}
