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

            data.examples.forEach(function (example) {
                let newOption = document.createElement('div');
                let nameEl = document.createElement('div');
                let name = example['name'].split('.')[0];
                let thumbnailEl = document.createElement('div');
                newOption.className = 'example-option';
                newOption.setAttribute('data-value', example['url']);
                nameEl.className = 'example-option-name';
                nameEl.textContent = name.replace(/-/g, ' ');
                thumbnailEl.className = 'example-thumbnail';
                thumbnailEl.style.backgroundColor = 'rgba(255,255,255,0.05)';
                thumbnailEl.style.backgroundImage = 'url(' + example['thumb'] + ')';
                newOption.appendChild(nameEl);
                newOption.appendChild(thumbnailEl);
                newOption.addEventListener('click', selectExample);
                listEl.appendChild(newOption);
                newOption.addEventListener('dblclick', function (e) {
                    examplesModal._handleConfirm();
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
