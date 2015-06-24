var CM_MINIMUM_WIDTH = 160 // integer, in pixels
var LOCAL_STORAGE_PREFIX = 'tangram-play-'

var draggable;

function initUI(cm, tangram) {
    var transformStyle = 'translate3d(' + getDividerStartingPosition() + 'px, 0px, 0px)';
    var dividerEl = document.getElementById('divider');
    if (dividerEl.style.hasOwnProperty('transform')) {
        dividerEl.style.transform = transformStyle;
    } else {
        // For Safari
        dividerEl.style.webkitTransform = transformStyle;
    }

    var count = 0;
    draggable = Draggable.create("#divider", {
        type: "x",
        bounds: getDraggableBounds(),
        cursor: 'col-resize',
        onDrag: reflowUI,
        onDragEnd: function () {
            updateUI(cm, tangram);
            saveDividerPosition();
        }
    });

    loadExamples("data/examples.json");
    window.addEventListener('resize', onWindowResize);
    reflowUI();

    document.getElementById('menu-button-open').addEventListener('click', function (e) {
        var menuEl = document.getElementById('menu-open')
        var posX = document.getElementById('menu-button-open').getBoundingClientRect().left
        menuEl.style.left = posX + 'px'
        menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block'
    }, false)

    document.getElementById('menu-button-new').addEventListener('click', onClickNewButton, false)
    document.body.addEventListener('click', function (e) {
        if (!e.target.classList.contains('menu-item') && !e.target.parentNode.classList.contains('menu-item') ) {
            loseMenuFocus()
        }
    }, false)
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
    setupFileSelector();
};

function setupFileSelector () {
    var fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', 'text/x-yaml');
    fileSelector.style.display = 'none';
    fileSelector.id = 'file-selector';
    document.body.appendChild(fileSelector);
}

function getDividerStartingPosition () {
    var storedPosition = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'divider-position-x')
    if (storedPosition) {
        return storedPosition
    }

    if (window.innerWidth > 1024) {
        return Math.floor(window.innerWidth * 0.6)
    } else {
        return Math.floor(window.innerWidth / 2)
    }
}

function saveDividerPosition () {
    var posX = document.getElementById('divider').getBoundingClientRect().left
    if (posX) {
        window.localStorage.setItem(LOCAL_STORAGE_PREFIX + 'divider-position-x', posX)
    }
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

function loadExamples (configFile) {
    var examples_data = JSON.parse(fetchHTTP(configFile));
    var examplesList = document.getElementById("examples");

    for (var i = 0; i < examples_data['examples'].length; i++) {
        var example = examples_data['examples'][i];
        var newOption = document.createElement('div');
        var nameEl = document.createElement('div');
        var name = example['name'].split('.')[0];
        var thumbnailEl = document.createElement('div');
        //var imgEl = document.createElement('img');
        newOption.className = 'example-option';
        newOption.setAttribute('data-value', example['url']);
        nameEl.className = 'example-option-name';
        nameEl.innerText = name.replace(/-/g, ' ');
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

function selectExample (event) {
    var all = document.querySelectorAll('.example-option');
    for (var i = 0, j = all.length; i < j; i++) {
        all[i].classList.remove('example-selected');
    }
    var target = event.target;
    while (!target.classList.contains('example-option')) {
        target = target.parentNode;
    }
    target.classList.add('example-selected');
    document.getElementById('example-confirm').disabled = false;
}

function openExample (value) {
    window.location.href = '.?style=' + value;
}

function openContent(input){
    var reader = new FileReader();
    reader.onload = function(e) {
        editor.setValue(e.target.result);
    }
    reader.readAsText(input.files[0]);
}

function saveContent(){
    if (editor) {
        var blob = new Blob([editor.getValue()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "style.yaml");
        isSaved = true;
    }
}

function isEditorSaved () {
    return isSaved;
}

function onWindowResize( event ) {
    reflowUI();
    applyNewDraggableBounds(draggable[0]);
    updateUI(editor, map);
}

function reflowUI() {
    var mapEl = document.getElementById('map');
    var contentEl = document.getElementById('content');
    var dividerEl = document.getElementById('divider');
    var menuEl = document.getElementById('menu-container');
    var menuHeight = menuEl.getBoundingClientRect().height;
    var positionX = dividerEl.getBoundingClientRect().left;

    mapEl.style.width = positionX + "px";
    contentEl.style.width = (window.innerWidth - positionX) + "px";

    editor.setSize('100%', (window.innerHeight - menuHeight) + 'px');
    dividerEl.style.height = (window.innerHeight - menuHeight) + 'px';
}

function updateUI(editor, map) {
    map.invalidateSize(false);
    updateWidgets(editor);
}

function applyNewDraggableBounds (draggable) {
    draggable.applyBounds(getDraggableBounds())
}

function getDraggableBounds () {
    return {
        minX: 100,
        maxX: window.innerWidth - CM_MINIMUM_WIDTH
    }
}

function takeScreenshot() {
    if (take_screenshot == false){
        take_screenshot = true;
        scene.requestRedraw();
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
    var modalEl = document.getElementById('confirm-unsaved')
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
    var els = document.querySelectorAll('.menu-dropdown');
    for (var i = 0, j = els.length; i < j; i++) {
        els[i].style.display = 'none';
    }
}

function loseMenuFocus () {
    hideMenus();
}

function onClickOpenFile (event) {
    if (isEditorSaved() === false) {
        showUnsavedModal(handleContinue, handleCancel);
    } else {
        handleContinue();
    }

    function handleContinue () {
        var input = document.getElementById('file-selector');
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
    document.getElementById('choose-example').style.display = 'none';
}

function onClickOpenExampleFromDialog () {
    var selected = document.querySelectorAll('.example-option.example-selected')[0];
    var value = selected.getAttribute('data-value');
    openExample(value);
}
