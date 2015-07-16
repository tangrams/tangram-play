import Editor from '../core/editor.js';

// Load some common functions
import { fetchHTTP } from '../core/common.js';
import Shield from './ui/Shield.js';
import FileDrop from './ui/FileDrop.js';
import FileOpen from './ui/FileOpen.js';
import Modal from './ui/Modal.js';

let tp;
let editor;
let shield;
let fileopen;
let filedrop;

export default class UI {
    constructor (tangram_play) {
        this.tangram_play = tangram_play;

        tp = tangram_play;
        editor = tangram_play.editor;

        const container = tangram_play.container;
        const options = tangram_play.options;

        this.loadExamples(options.menu);

        // Set up UI components
        this.shield = shield = new Shield();
        this.filedrop = filedrop = new FileDrop(container);
        this.fileopen = fileopen = new FileOpen(container);

        document.getElementById('menu-button-open').addEventListener('click', function (e) {
            let menuEl = document.getElementById('menu-open')
            let posX = document.getElementById('menu-button-open').getBoundingClientRect().left
            menuEl.style.left = posX + 'px'
            menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block'
            document.body.addEventListener('click', onClickOutsideDropdown, false)
        }, false)

        document.getElementById('menu-button-new').addEventListener('click', onClickNewButton, false)
        document.getElementById('menu-button-export').addEventListener('click', saveContent, false);
        document.getElementById('menu-open-file').addEventListener('click', function () { fileopen.activate() }, false)
        document.getElementById('menu-open-example').addEventListener('click', onClickOpenExample, false)
        document.getElementById('example-cancel').addEventListener('click', hideExamplesModal, false)
        document.getElementById('example-confirm').addEventListener('click', onClickOpenExampleFromDialog, false)
        document.body.addEventListener('keyup', function (e) {
            // esc key
            if (e.keyCode === 27) {
                // TODO. Implement after UI elements handle / remember state better
            }
        })

        window.onpopstate = function (e) {
            if (e.state && e.state.loadStyleURL) {
                this.tangram_play.loadQuery();
            }
        }
    };

    loadExamples (configFile) {
        let examples_data = JSON.parse(fetchHTTP(configFile));
        let examplesList = document.getElementById("examples");

        for (let i = 0; i < examples_data['examples'].length; i++) {
            let example = examples_data['examples'][i];
            let newOption = document.createElement('div');
            let nameEl = document.createElement('div');
            let name = example['name'].split('.')[0];
            let thumbnailEl = document.createElement('div');
            //let imgEl = document.createElement('img');
            newOption.className = 'example-option';
            newOption.setAttribute('data-value', example['url']);
            nameEl.className = 'example-option-name';
            nameEl.textContent = name.replace(/-/g, ' ');
            //imgEl.src = 'data/imgs/' + name + '.png';
            thumbnailEl.className = 'example-thumbnail';
            thumbnailEl.style.backgroundColor = 'rgba(255,255,255,0.05)';
            thumbnailEl.style.backgroundImage = 'url(https://cdn.rawgit.com/tangrams/tangram-sandbox/gh-pages/styles/' + name + '.png)';
            newOption.appendChild(nameEl);
            newOption.appendChild(thumbnailEl);
            //newOption.appendChild(imgEl);
            newOption.addEventListener('click', selectExample);
            examplesList.appendChild(newOption);
        }
    }
};

function onClickNewButton (event) {
    checkEditorSaveStateThenDoStuff(newContent);
}

function checkEditorSaveStateThenDoStuff (callback) {
    if (editor && editor.isSaved === false) {
        let unsavedModal = new Modal(tp, 'Your style has not been saved. Continue?', callback);
        unsavedModal.show();
    } else {
        callback();
    }
}

function newContent () {
    window.location.href = ".";
}

function selectExample(event) {
    let target = event.target;
    while (!target.classList.contains('example-option')) {
        target = target.parentNode;
    }
    resetExamples();
    target.classList.add('example-selected');
    document.getElementById('example-confirm').disabled = false;
}

function resetExamples () {
    let all = document.querySelectorAll('.example-option');
    for (let i = 0, j = all.length; i < j; i++) {
        all[i].classList.remove('example-selected');
    }
}

function openExample (value) {
    window.history.pushState({
        loadStyleURL: value
    }, null, '.?style=' + value + window.location.hash);
    tp.loadQuery();
}

function parseQuery (qstr) {
    let query = {};
    let a = qstr.split('&');
    for (let i in a) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
};

function saveContent () {
    if (editor) {
        let blob = new Blob([ tp.getContent()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "style.yaml");
        editor.isSaved = true;
    }
}

function hideMenus () {
    let els = document.querySelectorAll('.menu-dropdown');
    for (let i = 0, j = els.length; i < j; i++) {
        els[i].style.display = 'none';
    }
    document.body.removeEventListener('click', onClickOutsideDropdown, false);
}

function loseMenuFocus () {
    hideMenus();
}

function onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('menu-item')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('menu-item')) {
        loseMenuFocus();
        document.body.removeEventListener('click', onClickOutsideDropdown, false);
    }
}

function onClickOpenExample (event) {
    checkEditorSaveStateThenDoStuff(function () {
        showExamplesModal();
    })
}

function showExamplesModal () {
    shield.show();
    document.getElementById('choose-example').style.display = 'block';
}

function hideExamplesModal () {
    shield.hide();
    resetExamples();
    document.getElementById('example-confirm').disabled = true;
    document.getElementById('choose-example').style.display = 'none';
}

function onClickOpenExampleFromDialog () {
    let selected = document.querySelectorAll('.example-option.example-selected')[0];
    let value = selected.getAttribute('data-value');
    hideExamplesModal();
    openExample(value);
}
