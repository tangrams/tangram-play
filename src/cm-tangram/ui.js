var CM_MINIMUM_WIDTH = 160 // integer, in pixels
var LOCAL_STORAGE_PREFIX = 'tangram-play-'

var draggable;

function initUI(cm, tangram) {
    document.getElementById('divider').style.transform = 'translate3d(' + getDividerStartingPosition() + 'px, 0px, 0px)';
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
};

function getDividerStartingPosition () {
    if (window.localStorage) {
        var storedPosition = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'divider-position-x')
        if (storedPosition) {
            return storedPosition
        }
    }

    if (window.innerWidth > 1024) {
        return Math.floor(window.innerWidth * 0.6)
    } else {
        return Math.floor(window.innerWidth / 2)
    }
}

function saveDividerPosition () {
    if (window.localStorage) {
        var posX = document.getElementById('divider').getBoundingClientRect().left
        if (posX) {
            window.localStorage.setItem(LOCAL_STORAGE_PREFIX + 'divider-position-x', posX)
        }
    }
}

function newContent(){
    window.location.href = ".";
}

function loadExamples( configFile ) {
    var examples_data = JSON.parse(fetchHTTP(configFile));
    var examplesList = document.getElementById("examples");

    for (var i = 0; i < examples_data['examples'].length; i++ ){
        var example = examples_data['examples'][i];
        var newOption = document.createElement("option");
        newOption.value = example['url'];
        newOption.innerHTML= example['name'];
        examplesList.appendChild(newOption);
    }
}

function openExample(select){
    var option = select.options[select.selectedIndex].value;
    window.location.href = ".?style="+option;
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
