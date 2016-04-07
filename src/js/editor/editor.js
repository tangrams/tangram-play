// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/wrap/hardwrap';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/display/panel';
import 'codemirror/mode/javascript/javascript';

// Import additional parsers
import './codemirror/comment-tangram';
import './codemirror/hint-tangram';

// Keymap
import 'codemirror/keymap/sublime';

// Import Utils
import { getLineInd, unfoldAll, foldByLevel } from './codemirror/tools';

// Import Tangram Play functions
import { takeScreenshot } from '../map/map';

//  Main CM functions
//  ===============================================================================

export function initEditor (id) {
    // Add rulers
    let rulers = [];
    for (let i = 1; i < 10; i++) {
        let b = Math.round((0.88 + i / 90) * 255);
        rulers.push({ color: 'rgba(' + b + ',' + b + ',' + b + ', 0.08)',
                      column: i * 4,
                      lineStyle: 'dotted' });
    }

    // Create DOM (TODO)
    let dom = document.getElementById(id);

    // Initialize CodeMirror
    let cm = CodeMirror(dom, {
        value: 'Loading...',
        rulers: rulers,
        lineNumbers: true,
        matchBrackets: true,
        mode: 'text/x-yaml-tangram',
        keyMap: 'sublime',
        autoCloseBrackets: true,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            Tab: function(cm) {
                cm.replaceSelection(Array(cm.getOption('indentUnit') + 1).join(' '));
            },
            'Alt-F': function(cm) {
                cm.foldCode(cm.getCursor(), cm.state.foldGutter.options.rangeFinder);
            } ,
            'Alt-P': function(cm) {
                takeScreenshot();
            },
            'Ctrl-0': function(cm) {
                unfoldAll(cm);
            },
            'Ctrl-1': function(cm) {
                foldByLevel(cm, 0);
            },
            'Ctrl-2': function(cm) {
                foldByLevel(cm, 1);
            },
            'Ctrl-3': function(cm) {
                foldByLevel(cm, 2);
            },
            'Ctrl-4': function(cm) {
                foldByLevel(cm, 3);
            },
            'Ctrl-5': function(cm) {
                foldByLevel(cm, 4);
            },
            'Ctrl-6': function(cm) {
                foldByLevel(cm, 5);
            },
            'Ctrl-7': function(cm) {
                foldByLevel(cm, 6);
            },
            'Ctrl-8': function(cm) {
                foldByLevel(cm, 7);
            }
        },
        foldGutter: {
            rangeFinder: CodeMirror.fold.indent
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        showCursorWhenSelecting: true,
        theme: 'tangram',
        lineWrapping: true,
        autofocus: true,
        indentUnit: 4
    });

    // Hook events

    cm.getLineInd = function (nLine) {
        return getLineInd(this, nLine);
    };

    return cm;
}
