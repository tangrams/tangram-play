'use strict';

import TangramPlay, { container } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';
import EditorIO from 'app/addons/ui/EditorIO';
import { httpGet } from 'app/tools/common';

let examplesEl;

// TODO: Make this more self contained.
// This exports a class that does not need to be reused. It should just be a singleton object
// whose methods can be referred to within this module. Right now the class is instantiated
// elsewhere in Menu.js and means functions need to refer back to the TangramPlay object to
// access anything. (Alternative: everything is on the class, but, meh)

export default class ExamplesModal extends Modal {
    constructor (config) {
        super();

        this.el = examplesEl = container.querySelector('.tp-example-modal');
        this.message = 'Choose an example to open';
        loadExamples(config);

        this.onConfirm = () => {
            const selected = this.el.querySelectorAll('.tp-example-option.tp-example-selected')[0];
            const value = selected.getAttribute('data-value');
            TangramPlay.load({ url: value });
        };

        this.onAbort = () => {
            resetExampleSelection();
            this.el.querySelector('.tp-modal-confirm').disabled = true;
        };
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
        });
    }
}

// TODO: Refactor
function loadExamples (configFile) {
    httpGet(configFile, function (err, res) {
        const data = JSON.parse(res);
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
            thumbnailEl.style.backgroundImage = 'url(' + example['thumb'] + ')';
            newOption.appendChild(nameEl);
            newOption.appendChild(thumbnailEl);
            newOption.addEventListener('click', selectExample);
            listEl.appendChild(newOption);
            newOption.addEventListener('dblclick', function (e) {
                // This is a bit ridiculous
                TangramPlay.ui.menu.examplesModal._handleConfirm();
            })
        }
    });
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
