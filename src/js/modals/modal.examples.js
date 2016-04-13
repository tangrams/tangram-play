import TangramPlay from '../tangram-play';
import Modal from './modal';
import EditorIO from '../editor/io';

let examplesEl;

class ExamplesModal extends Modal {
    constructor (config) {
        super();

        // TODO: Load this another way?
        const CONFIG_FILE = 'data/menu.json';

        this.el = examplesEl = document.body.querySelector('.example-modal');
        this.message = 'Choose an example to open';
        loadExamples(CONFIG_FILE);

        this.onConfirm = () => {
            const selected = this.el.querySelectorAll('.example-option.example-selected')[0];
            const value = selected.getAttribute('data-value');
            TangramPlay.load({ url: value });
        };

        this.onAbort = () => {
            resetExampleSelection();
            this.el.querySelector('.modal-confirm').disabled = true;
        };
    }

    show () {
        EditorIO.checkSaveStateThen(() => {
            super.show();
        });
    }
}

export const examplesModal = new ExamplesModal();

// TODO: Refactor
function loadExamples (configFile) {
    window.fetch(configFile, { credentials: 'include' })
        .then((response) => {
            if (response.status !== 200) {
                throw response.status;
            }

            return response.json();
        })
        .then((data) => {
            const listEl = examplesEl.querySelector('.example-list');

            data.examples.forEach(category => {
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
                    newOption.addEventListener('click', selectExample);

                    listEl.appendChild(newOption);

                    newOption.addEventListener('dblclick', function (e) {
                        examplesModal._handleConfirm();
                    });
                });
            });
        })
        .catch((error) => {
            console.error('Error retrieving config file.', error);
        });
}

function selectExample (event) {
    let target = event.target;
    while (!target.classList.contains('example-option')) {
        target = target.parentNode;
    }
    resetExampleSelection();
    target.classList.add('example-selected');
    examplesEl.querySelector('.modal-confirm').disabled = false;
}

function resetExampleSelection () {
    const allExamples = examplesEl.querySelectorAll('.example-option');
    for (let example of allExamples) {
        example.classList.remove('example-selected');
    }
}
