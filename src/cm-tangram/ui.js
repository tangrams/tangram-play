function initUI(cm, tangram) {
    document.getElementById('divider').style.left = Math.floor(window.innerWidth / 2) + "px";

    Draggable.create("#divider", {
        type: "x",
        bounds: document.getElementById("wrapper"),
        onDrag: reflowUI,
        onDragEnd: function () {
            updateUI(cm, tangram);
        }
    });

    loadExamples("data/examples.json");
    window.addEventListener('resize', onWindowResize);

    reflowUI();
};

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
    }
}

function onWindowResize( event ) {
    reflowUI();
    updateUI(editor, map);
}

function reflowUI() {
    var mapEl = document.getElementById('map');
    var contentEl = document.getElementById('content');
    var dividerEl = document.getElementById('divider');
    var positionX = dividerEl.getBoundingClientRect().left;

    mapEl.style.width = positionX + "px";
    contentEl.style.marginLeft = mapEl.offsetWidth + "px";
    contentEl.style.width = (window.innerWidth - positionX) + "px";

    editor.setSize('100%', (window.innerHeight - 31) + 'px');
}

function updateUI(editor, map) {
    map.invalidateSize(false);
    updateWidgets(editor);
}
