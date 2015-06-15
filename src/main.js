var querry, editor, map;
var examples_file = "data/examples.json";
var style_file = "data/default.yaml";
var style_data = "";
var widget_colorPickers = [];
var widgets = [];

var mousedown = false,
    dragX = window.innerWidth/2.;

// CODE EDITOR
//----------------------------------------------
var updateContet = debounce(function(){
    var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
    var url = createObjectURL(new Blob([ editor.getValue() ]));
    scene.reload(url);

    updateWidgets()
}, 500);

function initEditor(){
    querry = parseQuery(window.location.search.slice(1));

    if (querry['style']){
        style_file = querry['style'];
    }

    // Load style_file into style content
    style_data = fetchHTTP(style_file);

    var demoEditor = document.getElementById("editor");
    if(demoEditor){
        editor = CodeMirror(demoEditor,{
            value: style_data,
            lineNumbers: true,
            matchBrackets: true,
            // mode: "text/x-yaml",
            mode: "text/x-yaml-tangram",
            keyMap: "sublime",
            autoCloseBrackets: true,
            extraKeys: {"Ctrl-Space": "autocomplete",
                        "Tab": function(cm) { 
                            var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                            cm.replaceSelection(spaces);
                        },
                        "Alt-F" : function(cm) {
                                        var pos = cm.getCursor();
                                        var opts = cm.state.foldGutter.options;
                                        cm.foldCode(pos, opts.rangeFinder);
                                    } ,
                        "Ctrl-0" : function(cm){unfoldAll(cm)},
                        "Ctrl-1" : function(cm){foldByLevel(cm,0)},
                        "Ctrl-2" : function(cm){foldByLevel(cm,1)},
                        "Ctrl-3" : function(cm){foldByLevel(cm,2)},
                        "Ctrl-4" : function(cm){foldByLevel(cm,3)},
                        "Ctrl-5" : function(cm){foldByLevel(cm,4)},
                        "Ctrl-6" : function(cm){foldByLevel(cm,5)},
                        "Ctrl-7" : function(cm){foldByLevel(cm,6)},
                        "Ctrl-8" : function(cm){foldByLevel(cm,7)}
            },
            foldGutter: { 
                rangeFinder: CodeMirror.fold.indent
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            showCursorWhenSelecting: true,
            theme: "tangram",
            lineWrapping: true,
            autofocus: true,
            indentUnit: 4
        });

        editor.on("change", function(cm) {
            updateContet();
        });

        demoEditor.addEventListener("mousedown", onClick);
    }  
}

function loadExamples() {
    var examples_data = JSON.parse(fetchHTTP("data/examples.json"));
    var examplesList = document.getElementById("examples");

    for (var i = 0; i < examples_data['examples'].length; i++ ){
        var example = examples_data['examples'][i];
        var newOption = document.createElement("option");
        newOption.value = example['url'];
        newOption.innerHTML= example['name'];
        examplesList.appendChild(newOption);
    }
}

function loadWidgets(){
    var widgets_data = JSON.parse(fetchHTTP("data/widgets.json"));

    for (var i = 0; i < widgets_data["colorpickers"].length; i++){
        var regex = new RegExp( widgets_data["colorpickers"][i].pattern );
        widget_colorPickers.push(regex);
    }
}

function updateWidgets(){
    var colorpickers = document.getElementsByClassName("color-picker");

    for (var i = colorpickers.length-1; i >=0 ; i--){
        colorpickers[i].parentNode.removeChild(colorpickers[i]);
    }
    widgets.length = 0;

    for (var nline = 0; nline < editor.doc.size; nline++){
        // Color Pickers
        for (var i = 0; i < widget_colorPickers.length; i++){
            if (widget_colorPickers[i].test( getTagAddress(editor, nline) ) ){
                var msg = document.createElement("div");
                msg.className = "color-picker";
                msg.style.background = getTagCompleteContent(scene, editor, nline);
                msg.style.border = "1px solid #A8ABAA";
                msg.style.borderRadius = "4px";
                widgets.push( editor.addWidget({line:nline, ch:editor.lineInfo(nline).handle.text.length }, msg) );
                msg.style.top = (parseInt(msg.style.top, 10) - 17)+"px";
                msg.style.left = (parseInt(msg.style.left, 10) + 5)+"px";
                msg.style.width = "17px";
                msg.style.height = "17px";
            }
        }
    }
}

// TANGRAM
//----------------------------------------------
function initMap() {
    'use strict';
    var map_start_location = [40.70531887544228, -74.00976419448853, 16];

    /*** URL parsing ***/

    // leaflet-style URL hash pattern:
    // ?style.yaml#[zoom],[lat],[lng]
    var url_hash = window.location.hash.slice(1).split('/');
    if (url_hash.length == 3) {
        map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
        // convert from strings
        map_start_location = map_start_location.map(Number);
    }

    /*** Map ***/
    map = L.map('map',
        { zoomControl: false },
        {'keyboardZoomOffset': .05}
    );

    L.control.zoom({ position: 'topright' }).addTo(map);

    map.attributionControl.setPrefix('<a href="http://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a>')
    var layer = Tangram.leafletLayer({
        scene: style_file,
        attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
    });

    window.layer = layer;
    var scene = layer.scene;
    window.scene = scene;

    map.setView(map_start_location.slice(0, 2), map_start_location[2]);
    var hash = new L.Hash(map);

    window.addEventListener('load', function () {
        // Scene initialized
        layer.addTo(map);
    });

    //disable mousewheel zoom if iframed
    if (window.self !== window.top) {
      map.scrollWheelZoom.disable();
    }
}

// Events
//----------------------------------------------
function newContent(){
    window.location.href = ".";
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

function resizeMap() {
    var width = document.getElementById('divider').offsetWidth;
    document.getElementById('map').style.width = (dragX) + "px";
    document.getElementById('divider').style.left = (dragX-width/2) + "px";
    document.getElementById('content').style.marginLeft = document.getElementById('map').offsetWidth + "px";
    document.getElementById('content').style.width =  (window.innerWidth - dragX) + "px"
    editor.setSize('100%',(window.innerHeight-31) + 'px');
    map.invalidateSize(false);
}

function dragStart(event){
    mousedown = true;
} 

function drag(event){
    if (!mousedown) return;
    dragX = event.clientX;
    resizeMap();
}

function dragRelease(){
    mousedown = false;
    resizeMap();
}

function onClick(event) {
    // var cursor = editor.getCursor(true);
    
    // console.log( ">>> " + getTagAddress(editor, cursor.line) );

    // if ( isCommented(editor,cursor.line) ){
    //     console.log("Comented line");
    // }

    // var address = getTagAddress(editor, cursor.line);

    // if ( isGlobalBlock(address) ){
    //     console.log("GLOBAL Shader Block");
    // } else if ( isColorBlock(address) ){
    //     console.log("COLOR Shader Block");
    // } else if ( isNormalBlock(address) ){
    //     console.log("NORMAL Shader Block");
    // } else if ( isFilterBlock(address) ){
    //     console.log("FILTER Shader Block");
    // } 

    // console.log( getTagCompleteContent(scene, editor, cursor.line) );
}

window.addEventListener('resize', resizeMap);

// MAIN
//----------------------------------------------
initEditor();
initMap();

resizeMap();
loadExamples();
loadWidgets();

// Once everything is loaded
setTimeout(function () {
    if (querry['foldLevel']){
        unfoldAll(editor);
        foldByLevel(editor,parseInt(querry['foldLevel']));
    }
    if (querry['lines']){
        selectLines(editor,querry['lines']);
    }
    updateWidgets();
}, 1000);
