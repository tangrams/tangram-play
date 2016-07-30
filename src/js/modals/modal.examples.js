import TangramPlay from '../tangram-play';
import Modal from './modal-old';
import EditorIO from '../editor/io';

import EXAMPLES_DATA from './examples.json';

class ExamplesModal extends Modal {
    constructor (config) {
        const message = 'Choose an example to open';
        const onConfirm = () => {
            const selected = this.el.querySelectorAll('.example-option.example-selected')[0];
            const url = selected.getAttribute('data-value');
            TangramPlay.load({ url });
        };
        const onAbort = () => {
            this._resetExampleSelection();
            this.el.querySelector('.modal-confirm').disabled = true;
        };

        super(message, onConfirm, onAbort, {
            el: document.body.querySelector('.example-modal')
        });

        this._loadExamples();
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
        });
    }

    _loadExamples () {
        const listEl = this.el.querySelector('.example-list');

        // TODO: Refactor DOM building
        EXAMPLES_DATA.forEach(category => {
            const categoryHeaderEl = document.createElement('h2');
            const categoryUnderlineEl = document.createElement('hr');

            categoryHeaderEl.className = 'example-list-header';
            categoryHeaderEl.textContent = category.category;

            listEl.appendChild(categoryHeaderEl);
            listEl.appendChild(categoryUnderlineEl);

            category.scenes.forEach(scene => {
                const newOption = document.createElement('div');
                const nameEl = document.createElement('div');
                const thumbnailEl = document.createElement('div');

                newOption.className = 'example-option';
                newOption.setAttribute('data-value', scene.url);

                nameEl.className = 'example-option-name';
                nameEl.textContent = scene.name;

                thumbnailEl.className = 'example-thumbnail';
                thumbnailEl.style.backgroundColor = 'rgba(255,255,255,0.05)';
                thumbnailEl.style.backgroundImage = 'url(' + scene.thumb + ')';

                newOption.appendChild(nameEl);
                newOption.appendChild(thumbnailEl);
                newOption.addEventListener('click', event => {
                    this._selectExample(event.target);
                });

                listEl.appendChild(newOption);

                newOption.addEventListener('dblclick', event => {
                    this._handleConfirm();
                });
            });
        });
    }

    _selectExample (target) {
        while (!target.classList.contains('example-option')) {
            target = target.parentNode;
        }
        this._resetExampleSelection();
        target.classList.add('example-selected');
        this.el.querySelector('.modal-confirm').disabled = false;
    }

    _resetExampleSelection () {
        const allExamples = this.el.querySelectorAll('.example-option');
        for (let example of allExamples) {
            example.classList.remove('example-selected');
        }
    }
}

export const examplesModal = new ExamplesModal();
