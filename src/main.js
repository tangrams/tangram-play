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
        if ( isNumber(_string) ){
            selectLine(parseInt(_string)-1);
            jumpToLine(parseInt(_string)-1);
        } else {
            var lines = _string.split('-');
            var from = parseInt(lines[0])-1;
            var to = parseInt(lines[1])-1;

            editor.setSelection({ line: from, ch:0},
                                { line: to, ch:editor.lineInfo(to).text.length } );
            jumpToLine(from);
        }
    }
}

// function foldByLevel(cm, level) {
//     foldByNodeOrder(cm, 0);
//     // initialize vars
//     var cursor = cm.getCursor();
//     cursor.ch = 0;
//     cursor.line = 0;
//     var range = cm.getViewport();
//     foldByLevelRec(cm, cursor, range, level);
// };

// function foldByLevelRec(cm, cursor, range, level) {
//     if (level > 0) {
//         var searcher = cm.getSearchCursor("<", cursor, false);
//         while (searcher.findNext() && searcher.pos.from.line < range.to) {
//             // unfold the tag
//             cm.foldCode(searcher.pos.from, null, "unfold");
//             // move the cursor into the tag
//             cursor = searcher.pos.from;
//             cursor.ch = searcher.pos.from.ch + 1;
//             // find the closing tag
//             var match = CodeMirror.findMatchingTag(cm, cursor, range);
//             if (match) {
//                 if (match.close) {
//                     // create the inner-range and jump the searcher after the ending tag
//                     var innerrange = { from: range.from, to: range.to };
//                     innerrange.from = cursor.line + 1;
//                     innerrange.to = match.close.to.line;
//                     // the recursive call
//                     foldByLevelRec(cm, cursor, innerrange, level - 1);
//                 }
//                 // move to the next element in the same tag of this function scope
//                 var nextcursor = { line: cursor.line, to: cursor.ch };
//                 if (match.close) {
//                     nextcursor.line = match.close.to.line;
//                 }
//                 nextcursor.ch = 0;
//                 nextcursor.line = nextcursor.line + 1;
//                 searcher = cm.getSearchCursor("\t", nextcursor, false);
//             }
//         }
//     }
// }

// function foldByNodeOrder(cm, node) {
//     // 0 - fold all
//     unfoldAll(cm);
//     node++;
//     for (var l = cm.firstLine() ; l <= cm.lastLine() ; ++l)
//         if (node == 0)
//             cm.foldCode({ line: l, ch: 0 }, null, "fold");
//         else node--;
// }

// function unfoldAll() {
//     for (var i = 0; i < editor.lineCount() ; i++) {
//         editor.foldCode({ line: i }, null, "unfold");
//     }
// }

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
    if (editor) {
        var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
        var url = createObjectURL(new Blob([ editor.getValue() ]));
        scene.reload(url);
    }
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
            extraKeys: { },
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

setupEditor();
