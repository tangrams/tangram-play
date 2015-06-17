var querry, editor, map;
var examples_file = "data/examples.json";
var style_file = "data/default.yaml";
var style_data = "";
var widgets = [];

// CODE EDITOR
//----------------------------------------------
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

        editor.on("change", function(cm){
            var updateContet = debounce( function(){
                var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
                var url = createObjectURL(new Blob([ editor.getValue() ]));
                scene.reload(url);

                updateWidgets();
            }, 500);
            updateContet();
        });

        editor.on("viewportChange", function(cm){
            var updateViewPort = debounce( function(){
                updateWidgets();
            },100);
            updateViewPort();
        });

        demoEditor.addEventListener("mousedown", onClick);
    }

    Draggable.create("#divider", {
        type: "x",
        bounds: document.getElementById("wrapper"),
        onDrag: function (pointerEvent) {
            var mapEl = document.getElementById('map');
            var contentEl = document.getElementById('content');
            var dividerEl = document.getElementById('divider');
            var positionX = dividerEl.getBoundingClientRect().left;

            mapEl.style.width = positionX + "px";
            contentEl.style.marginLeft = mapEl.offsetWidth + "px";
            contentEl.style.width = (window.innerWidth - positionX) + "px";

            editor.setSize('100%', (window.innerHeight - 31) + 'px');
            //map.invalidateSize(false);
        },
        onDragEnd: function () {
            map.invalidateSize(false);
        }
    });
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

    for (var i = 0; i < widgets_data["widgets"].length; i++){
        var obj = {};
        obj.type = widgets_data["widgets"][i].type;
        obj.token = addWidgetToken(widgets_data["widgets"][i]);

        if ( obj.type === "dropdownmenu" ){
            obj.options = widgets_data["widgets"][i].options;
        }

        widgets.push( obj );
    }
}

function addWidgetToken( widgetOBJ ){
    var token;
    if ( widgetOBJ['address'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['address'] ).test( getTagAddress(cm, nLine) );
        };
    } else if ( widgetOBJ['tag'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['tag'] ).test( getTag(cm, nLine) );
        };
    } else if ( widgetOBJ['value'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['value'] ).test( getValue(cm, nLine) );
        };
    } else if ( widgetOBJ['content'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['content'] ).test( getTagCompleteContent(scene, cm, nLine) );
        };
    } else {
        token = function(scene, cm, nLine) {
            return false;
        };
    }
    return token;
}

function updateWidgets(){
    var colorpickers = document.getElementsByClassName("widget");
    for (var i = colorpickers.length-1; i >=0 ; i--){
        colorpickers[i].parentNode.removeChild(colorpickers[i]);
    }

    for (var nline = 0; nline < editor.doc.size; nline++){    
        var val = getValue(editor,nline);

        // If Line is significative
        if (getTag(editor,nline) !== "" && val !== "|" && val !== "" ){
            // Chech for Colors
            for (var i = 0; i < widgets.length; i++){
                if ( widgets[i].token(scene,editor,nline) ){
                    var content = getValue(editor, nline);

                    if (widgets[i].type === "colorpicker"){
                        var btn = document.createElement("div");
                        btn.style.zIndex = "10";
                        btn.style.background = toCSS(content);   
                        btn.className = "widget";
                        btn.style.border = "1px solid #A8ABAA";
                        btn.style.borderRadius = "4px";
                        editor.addWidget({line:nline, ch:editor.lineInfo(nline).handle.text.length }, btn);
                        btn.style.top = (parseInt(btn.style.top, 10) - 17)+"px";
                        btn.style.left = (parseInt(btn.style.left, 10) + 5)+"px";
                        btn.style.width = "17px";
                        btn.style.height = "17px";
                        break;
                    } else if (widgets[i].type === "dropdownmenu"){

                        var list = document.createElement('Select');
                        list.className = "widget";
                        list.style.zIndex = "10";

                        var selected = -1;
                        for (var j = 0; j < widgets[i].options.length ; j++ ){
                            var newOption = document.createElement("option");
                            newOption.value = nline;
                            if (content === widgets[i].options[j]) {
                                newOption.selected = true;
                            }
                            newOption.innerHTML= widgets[i].options[j];
                            list.appendChild(newOption);
                        }

                        editor.addWidget({line:nline, ch:editor.lineInfo(nline).handle.text.length }, list);
                        list.style.top = (parseInt(list.style.top, 10) - 17)+"px";
                        list.style.left = (parseInt(list.style.left, 10) + 5)+"px";
                        list.setAttribute('onchange','dropdownMenuChange(this)');
                        break;
                    } else if (widgets[i].type === "togglebutton"){
                        var check = document.createElement('Input');
                        check.type = 'checkbox';
                        check.className = "widget";
                        check.style.zIndex = "10";
                        check.value = nline;
                        check.checked = getValue(editor,nline) === "true" ? true : false;
                        editor.addWidget({line:nline, ch:editor.lineInfo(nline).handle.text.length }, check);
                        check.style.top = (parseInt(check.style.top, 10) - 17)+"px";
                        check.style.left = (parseInt(check.style.left, 10) + 5)+"px";
                        check.setAttribute('onchange','toggleButton(this)');
                        break;
                    }

                }
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

function dropdownMenuChange(select) {
    setValue(   editor,
                parseInt(select.options[select.selectedIndex].value), 
                select.options[select.selectedIndex].innerHTML );
}

function toggleButton(check) {
    setValue(   editor,
                parseInt(check.value), 
                check.checked?"true":"false" );
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

function resizeMap (event) {
    var mapEl = document.getElementById('map');
    var contentEl = document.getElementById('content');
    var dividerEl = document.getElementById('divider');

    if (!event) {
        dividerEl.style.left = Math.floor(window.innerWidth / 2) + "px";
    }

    var positionX = dividerEl.getBoundingClientRect().left;

    mapEl.style.width = positionX + "px";
    contentEl.style.marginLeft = mapEl.offsetWidth + "px";
    contentEl.style.width = (window.innerWidth - positionX) + "px";

    editor.setSize('100%', (window.innerHeight - 31) + 'px');
    map.invalidateSize(false);
    updateWidgets()
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
