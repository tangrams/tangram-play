var style_file = "styles/default.yaml";
var style_content = ""; 

function fetchHTTP(url, methood){
    var request = new XMLHttpRequest(), response;

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            response = request.responseText;
        }
    }
    request.open(methood ? methood : 'GET', url, false);
    request.send();
    return response;
}

var map = (function () {
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

    var style_file = 'styles/default.yaml';
    var url_search = window.location.search.slice(1);
    if (url_search.length > 0) {
        console.log(url_search);
        var ext = url_search.substr(url_search.lastIndexOf('.') + 1);
        if (ext == "yaml" || ext == "yaml/") {
            style_file = 'styles/'+url_search;
            console.log('LOADING' + url_search + ' STYLE');
        } else {
            style_file = 'styles/'+url_search+'.yaml';
            console.log('LOADING' + url_search + ' STYLE and INFO');
        }
    }

    style_content = fetchHTTP(style_file);

    /*** Map ***/

    var map = L.map('map',
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

    return map;
}());

function newContent(){
    console.log("New Content");
    window.location.href = ".";
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
        var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
        var url = createObjectURL(new Blob([ editor.getValue() ]));
        scene.reload(url);
        console.log("Content reloaded");
    }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

var saveDebounced = debounce(function(){
    saveContent();
}, 500);

var editor;
var demoEditor = document.getElementById("editor");
if(demoEditor){
    editor = CodeMirror(demoEditor,{
        value: style_content,
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/x-yaml",
        keyMap: "sublime",
        autoCloseBrackets: true,
        extraKeys: {"Ctrl-Space": "autocomplete"},
        showCursorWhenSelecting: true,
        theme: "monokai",
        scrollbarStyle: "simple",
        lineWrapping: true,
        autofocus: true,
        indentUnit: 4
    });

    editor.on("change", function(cm) {
        saveDebounced();
    });
}