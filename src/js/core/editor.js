// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
// import 'codemirror/addon/comment/comment';
import 'codemirror/addon/wrap/hardwrap';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/display/panel';
import 'codemirror/keymap/sublime';
import 'codemirror/mode/javascript/javascript';

// Import additional parsers
import GLSLTangram from './codemirror/glsl-tangram.js';
import YAMLTangram from './codemirror/yaml-tangram.js';
import { getKeyPairs } from './codemirror/yaml-tangram.js';
import './codemirror/comment-tangram.js';

// Import Utils
import { fetchHTTP, debounce } from './common.js';
import { selectLines, unfoldAll, foldByLevel } from './codemirror/tools.js';

//  Main CM functions
//  ===============================================================================
var updateContent = debounce( function(cm, changes) {
    let createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity

    //  If doesn't have a API key
    //  inject a Tangram-Play one: vector-tiles-x4i7gmA ( Patricio is the owner )
    let content = cm.getValue();
    let pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
    let result = "$1?api_key=vector-tiles-x4i7gmA"
    content = content.replace(pattern, result);

    if (scene) {
        let url = createObjectURL(new Blob([content]));
        scene.reload(url);
    }
}, 500);

export function initEditor(tangram_play, place) {

    // Add rulers
    let rulers = [];
    for (let i = 1; i < 10; i++) {
        let b = Math.round((0.88 + i/90)*255);
        rulers.push({   color: 'rgb('+b+','+b+','+b+')',
                        column: i * 4,
                        lineStyle: "dashed"     });
    }

    // Create DOM (TODO)
    let dom = document.getElementById(place);

    // Initialize CodeMirror
    let cm = CodeMirror(dom ,{
        value: "Loading...",
        rulers: rulers,
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/x-yaml-tangram",
        keyMap: "sublime",
        autoCloseBrackets: true,
        extraKeys: {"Ctrl-Space": "autocomplete",
                    "Tab": function(cm) { cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" ")); },
                    "Alt-F" : function(cm) { cm.foldCode(cm.getCursor(), cm.state.foldGutter.options.rangeFinder); } ,
                    "Alt-P" : function(cm) { cm.tangram_play.takeScreenshot(); },
                    "Ctrl-0" : function(cm) { cm.tangram_play.unfoldAll() },
                    "Ctrl-1" : function(cm) { cm.tangram_play.foldByLevel(0) },
                    "Ctrl-2" : function(cm) { cm.tangram_play.foldByLevel(1) },
                    "Ctrl-3" : function(cm) { cm.tangram_play.foldByLevel(2) },
                    "Ctrl-4" : function(cm) { cm.tangram_play.foldByLevel(3) },
                    "Ctrl-5" : function(cm) { cm.tangram_play.foldByLevel(4) },
                    "Ctrl-6" : function(cm) { cm.tangram_play.foldByLevel(5) },
                    "Ctrl-7" : function(cm) { cm.tangram_play.foldByLevel(6) },
                    "Ctrl-8" : function(cm) { cm.tangram_play.foldByLevel(7) },
                    "Ctrl-\\" : function(cm) { console.log("comment") }
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

    cm.tangram_play = tangram_play;
    cm.isSaved = true;

    //  Hook events

    // Update widgets & content after a batch of changes
    cm.on('changes', function (cm, changes) {
        if (cm.isSaved) {
            cm.isSaved = false;
        }
        
        updateContent(cm, changes);
    });

    cm.getLineInd = function(nLine){
        return getLineInd(this,nLine);
    }

    return cm;
};