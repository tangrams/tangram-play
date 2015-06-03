var querry, editor, map;
var style_file = "styles/default.yaml";
var style_content = "";

// TOOLS
//----------------------------------------------
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

function parseQuery(qstr){
  var query = {};
  var a = qstr.split('&');
  for (var i in a){
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
  }

  return query;
}

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 

function getLevel(nLine){
    return Math.floor( (editor.lineInfo(nLine).text.match(/\s/g) || []).length / editor.getOption("tabSize"));
}

function isFolder(nLine){
    if ( editor.lineInfo(nLine).gutterMarkers ){
        return editor.lineInfo(nLine).gutterMarkers['CodeMirror-foldgutter'] !== null;
    } else {
        return false;
    }
}

function isFold(nLine){
    if (nLine >= 0){

    }
    if ( isFolder(nLine) ){
        return editor.lineInfo(nLine).gutterMarkers['CodeMirror-foldgutter'] !== null;
    } else {
        return false;
    }
}

function jumpToLine(i) { 
    var t = editor.charCoords({line: i-1, ch: 0}, "local").top; 
    // var middleHeight = editor.getScrollerElement().offsetHeight / 2; 
    editor.scrollTo(null, t);// - middleHeight - 5); 
} 

function selectLine( nLine ){
    if (editor) {
        editor.setSelection({ line: nLine, ch:0},
                            { line: nLine, ch:editor.lineInfo(nLine).text.length } );
    }
}

function selectLines( _string ){
    if (editor) {
        var from, to;

        if ( isNumber(_string) ){
            from = parseInt(_string)-1;
            to = from; 
        } else {
            var lines = _string.split('-');
            from = parseInt(lines[0])-1;
            to = parseInt(lines[1])-1;
        }

        if (querry['foldLevel']){
            foldAllBut(from,to,querry['foldLevel']);
        }
        
        editor.setSelection({ line: from, ch:0},
                            { line: to, ch:editor.lineInfo(to).text.length } );
        jumpToLine(from);
    }
}

function foldAllBut(From, To, querryLevel) {
    foldByLevel(querryLevel);

    // get minimum indentation
    var minLevel = 10;
    var startOn = To;
    var onBlock = true;

    for (var i = From-1; i >= 0; i--) {

        var level = getLevel(i);

        if (level === 0){
            break;
        }

        if (level < minLevel ){
            minLevel = level;
        } else if (onBlock) {
            startOn = i;
            onBlock = false;
        }
    }

    minLevel = 10;
    for (var i = To; i >= From; i--) {
        var level = getLevel(i);
        var chars = editor.lineInfo(i).text.length;
        if (level < minLevel && chars > 0){
            minLevel = level;
        }
    }
    var opts = editor.state.foldGutter.options;

    for (var i = startOn; i >= 0; i--) {
        var level = getLevel(i);

        if (level === 0 && editor.lineInfo(i).text.length > 0){
            break;
        }

        if ( level <= minLevel ){
            editor.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }

    for (var i = To; i < editor.lineCount() ; i++) {
        if (getLevel(i) >= querryLevel){
            editor.foldCode({ line: i }, opts.rangeFinder, "fold");
        }
    }
}

function unfoldAll() {
    var opts = editor.state.foldGutter.options;
    for (var i = 0; i < editor.lineCount() ; i++) {
        editor.foldCode({ line: i }, opts.rangeFinder, "unfold");
    }
}

function foldByLevel(level) {    
    var opts = editor.state.foldGutter.options;

    var actualLine = 0;
    var lastLine = editor.getDoc().size;
    while ( actualLine < lastLine) {
        if ( isFolder(actualLine) ){
            if (getLevel(actualLine) === level){
                editor.foldCode({line:actualLine,ch:0}, opts.rangeFinder);
            }
        }
        actualLine++;
    }
};

// CODE EDITOR
//----------------------------------------------
function newContent(){
    window.location.href = ".";
}

function openContent(input){
    var reader = new FileReader();
    reader.onload = function(e) {
        editor.setValue(e.target.result);
    }
    reader.readAsText(input.files[0]);
}

var updateContet = debounce(function(){
    var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
    var url = createObjectURL(new Blob([ editor.getValue() ]));
    scene.reload(url);
}, 500);

function saveContent(){
    if (editor) {
        var blob = new Blob([editor.getValue()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "style.yaml");
    }
}

function initEditor(){
    querry = parseQuery(window.location.search.slice(1));

    if (querry['style']){
        style_file = querry['style'];
    }

    // Load style_file into style content
    style_content = fetchHTTP(style_file);

    var demoEditor = document.getElementById("editor");
    if(demoEditor){
        editor = CodeMirror(demoEditor,{
            value: style_content,
            lineNumbers: true,
            matchBrackets: true,
            mode: "text/x-yaml",
            keyMap: "sublime",
            autoCloseBrackets: true,
            extraKeys: {"Alt-F" : function(cm) {
                                        var pos = cm.getCursor();
                                        var opts = cm.state.foldGutter.options;
                                        cm.foldCode(pos, opts.rangeFinder);
                                    } ,
                        "Ctrl-0" : function(cm){unfoldAll()},
                        "Ctrl-1" : function(cm){unfoldAll(); foldByLevel(0)},
                        "Ctrl-2" : function(cm){unfoldAll(); foldByLevel(1)},
                        "Ctrl-3" : function(cm){unfoldAll(); foldByLevel(2)},
                        "Ctrl-4" : function(cm){unfoldAll(); foldByLevel(3)},
                        "Ctrl-5" : function(cm){unfoldAll(); foldByLevel(4)},
                        "Ctrl-6" : function(cm){unfoldAll(); foldByLevel(5)},
                        "Ctrl-7" : function(cm){unfoldAll(); foldByLevel(6)},
                        "Ctrl-8" : function(cm){unfoldAll(); foldByLevel(7)}
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
    }  
}

function setupEditor(){
    if (querry['foldLevel']){
        unfoldAll();
        foldByLevel(parseInt(querry['foldLevel']));
    }

    if (querry['lines']){
        selectLines(querry['lines']);
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
function resizeMap() {
    editor.setSize('100%',(window.innerHeight-31) + 'px');
}

window.addEventListener('resize', resizeMap);

// MAIN
//----------------------------------------------
initEditor();

initMap();
resizeMap();

setTimeout(function () {
    setupEditor();
}, 1000);
