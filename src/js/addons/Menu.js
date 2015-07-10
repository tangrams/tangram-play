import Editor from '../core/editor.js';

// Load some common functions
import { fetchHTTP } from '../core/common.js';

let tp;
let editor;

export default class Menu {
    constructor (tangram_play, configFile) {
        this.tangram_play = tangram_play;

        tp = tangram_play;
        editor = tangram_play.editor;

        this.loadExamples(configFile);

        document.getElementById('menu-button-open').addEventListener('click', function (e) {
            let menuEl = document.getElementById('menu-open')
            let posX = document.getElementById('menu-button-open').getBoundingClientRect().left
            menuEl.style.left = posX + 'px'
            menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block'
            document.body.addEventListener('click', onClickOutsideDropdown, false)
        }, false)

        document.getElementById('menu-button-new').addEventListener('click', onClickNewButton, false)
        document.getElementById('menu-button-export').addEventListener('click', saveContent, false);
        document.getElementById('menu-open-file').addEventListener('click', onClickOpenFile, false)
        document.getElementById('menu-open-example').addEventListener('click', onClickOpenExample, false)
        document.getElementById('example-cancel').addEventListener('click', hideExamplesModal, false)
        document.getElementById('example-confirm').addEventListener('click', onClickOpenExampleFromDialog, false)
        document.body.addEventListener('keyup', function (e) {
            // esc key
            if (e.keyCode === 27) {
                // TODO. Implement after UI elements handle / remember state better
            }
        })


        // Setup File Selector;
        let fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('accept', 'text/x-yaml');
        fileSelector.style.display = 'none';
        fileSelector.id = 'file-selector';
        fileSelector.addEventListener('change', function (event) {
            let files = event.target.files;
            openContent(files[0]);
        });
        document.body.appendChild(fileSelector);

        // Set up drag/drop file listeners
        document.body.addEventListener('dragenter', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            showFileDropArea();
        }, true)
        document.getElementById('file-drop').addEventListener('dragover', function (e) {
            e.preventDefault();
            showFileDropArea();
        }, false)
        document.getElementById('file-drop').addEventListener('dragleave', function (e) {
            e.preventDefault();
            hideFileDropArea();
        }, true)
        document.getElementById('file-drop').addEventListener('drop', onDropFile, false)

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

function openContent (content) {
    let reader = new FileReader();
    reader.onload = function(e) {
        tangramPlay.loadContent( e.target.result );
    }
    reader.readAsText(content);
}

function onClickNewButton (event) {
    if (isEditorSaved() === false) {
        showUnsavedModal(handleContinue, handleCancel)
    } else {
        handleContinue()
    }

    function handleContinue () {
        newContent();
    }

    function handleCancel () {
        return;
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

function isEditorSaved () {
    if (editor) {
        return editor.isSaved;
    } else {
        return false;
    }
}

function showShield () {
    document.getElementById('shield').style.display = 'block'
}

function hideShield () {
    document.getElementById('shield').style.display = 'none'
}

function showUnsavedModal (confirmCallback, cancelCallback) {
    showShield()
    let modalEl = document.getElementById('confirm-unsaved')
    modalEl.style.display = 'block'
    modalEl.querySelector('#modal-confirm').addEventListener('click', handleConfirm, false)
    modalEl.querySelector('#modal-cancel').addEventListener('click', handleCancel, false)

    function handleConfirm () {
        hideUnsavedModal()
        confirmCallback()
    }

    function handleCancel () {
        hideUnsavedModal()
        cancelCallback()
    }

    function hideUnsavedModal () {
        hideShield();
        document.getElementById('confirm-unsaved').style.display = 'none'
        modalEl.querySelector('#modal-confirm').removeEventListener('click', handleConfirm, false)
        modalEl.querySelector('#modal-cancel').removeEventListener('click', handleCancel, false)
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

function onClickOpenFile (event) {
    if (isEditorSaved() === false) {
        showUnsavedModal(handleContinue, handleCancel);
    } else {
        handleContinue();
    }

    function handleContinue () {
        let input = document.getElementById('file-selector');
        input.click();
    }

    function handleCancel () {
        return;
    }
}

function onClickOpenExample (event) {
    if (isEditorSaved() === false) {
        showUnsavedModal(handleContinue, handleCancel);
    } else {
        handleContinue();
    }

    function handleContinue () {
        showExamplesModal();
    }

    function handleCancel () {
        return;
    }
}

function showExamplesModal () {
    showShield();
    document.getElementById('choose-example').style.display = 'block';
}

function hideExamplesModal () {
    hideShield();
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

function showFileDropArea () {
    document.getElementById('file-drop').style.display = 'block';
}

function hideFileDropArea () {
    document.getElementById('file-drop').style.display = 'none';
}

function onDropFile (event) {
    event.preventDefault();
    hideFileDropArea();
    let file = "";
    let dataTransfer = event.dataTransfer;
    if (dataTransfer.files.length > 0) {
        file = dataTransfer.files[0];
        if (isEditorSaved() === false) {
            showUnsavedModal(handleContinue, handleCancel);
        } else {
            handleContinue();
        }
    }

    function handleContinue () {
        openContent(file);
    }

    function handleCancel () {
        return;
    }
}