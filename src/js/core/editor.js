// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/comment/comment';
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

// Import Utils
import { fetchHTTP, debounce } from './common.js';

//  Main CM functions
//  ===============================================================================
var updateContent = debounce( function(cm) {
    var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity

    //  If doesn't have a API key
    //  inject a Tangram-Play one: vector-tiles-x4i7gmA ( Patricio is the owner )
    var content = cm.getValue();
    var pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
    var result = "$1??api_key=vector-tiles-x4i7gmA"
    content = content.replace(pattern, result);

    if (scene) {
        var url = createObjectURL(new Blob([content]));
        scene.reload(url);
    }
}, 500);

export default class Editor {
    constructor (place, style_file) {

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
        this.codemirror = CodeMirror(dom ,{
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
                        "Alt-P" : function(cm) {takeScreenshot();},
                        "Ctrl-0" : function(cm) {unfoldAll(cm)},
                        "Ctrl-1" : function(cm) {foldByLevel(cm,0)},
                        "Ctrl-2" : function(cm) {foldByLevel(cm,1)},
                        "Ctrl-3" : function(cm) {foldByLevel(cm,2)},
                        "Ctrl-4" : function(cm) {foldByLevel(cm,3)},
                        "Ctrl-5" : function(cm) {foldByLevel(cm,4)},
                        "Ctrl-6" : function(cm) {foldByLevel(cm,5)},
                        "Ctrl-7" : function(cm) {foldByLevel(cm,6)},
                        "Ctrl-8" : function(cm) {foldByLevel(cm,7)}
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

        //  Create a saving state on codemirror
        this.codemirror.isSaved = true;

        //  Hook events
        //----------------------------

        //  Update Tangram Map when stop typing
        this.codemirror.on('change', function (cm, changeObj) {
            if (cm.isSaved) {
                cm.isSaved = false;
            }
        });

        // Update content after a batch of changes
        this.codemirror.on('changes', function (cm, changes) {
            updateContent(cm);
        });

        // cm.on("mousedown", function(event) {
        //     // var cursor = editor.getCursor(true);
        // });

        if (style_file){
            this.loadStyle(style_file);
        }
    };

    load (content) {
        //  Delete API Key
        content = content.replace(/\?api_key\=(\w|\-)*$/gm,"");

        this.codemirror.setValue(content);
        this.codemirror.isSaved = true;
    };

    loadStyle (style_file) {
        this.load( fetchHTTP(style_file) );
    };

    getContent () {
        return this.codemirror.getValue();
    };

    getLineInd (nLine) {
        return getLineInd(this.codemirror,nLine);
    };
};
