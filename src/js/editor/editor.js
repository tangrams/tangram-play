// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/comment/comment';
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
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/javascript/javascript';

// Import additional parsers
import './codemirror/yaml-tangram';
import './codemirror/hint-tangram';

// Keymap
import 'codemirror/keymap/sublime';

// Import Utils
import { unfoldAll, foldByLevel } from './codemirror/tools';

// Import Tangram Play functions
import { takeScreenshot } from '../map/map';

// Export CodeMirror instance
export const editor = initCodeMirror(document.getElementById('editor'));

// Debug
window.editor = editor;

//  CodeMirror
//  ===============================================================================

function initCodeMirror (el) {
    // Add rulers
    const rulers = [];
    for (let i = 1; i < 10; i++) {
        const b = Math.round((0.88 + i / 90) * 255);
        rulers.push({
            color: 'rgba(' + b + ',' + b + ',' + b + ', 0.08)',
            column: i * 4,
            lineStyle: 'dotted'
        });
    }

    // Initialize CodeMirror
    const cm = new CodeMirror(el, {
        value: 'Loading...',
        rulers: rulers,
        styleActiveLine: true,
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: 'text/x-yaml-tangram',
        keyMap: 'sublime',
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            // Maps the tab key to insert spaces instead of a tab character.
            // https://codemirror.net/doc/manual.html#keymaps
            Tab: function (cm) {
                cm.replaceSelection(Array(cm.getOption('indentUnit') + 1).join(' '));
            },
            'Alt-F': function (cm) {
                cm.foldCode(cm.getCursor(), cm.state.foldGutter.options.rangeFinder);
            },
            'Alt-P': function (cm) {
                takeScreenshot();
            },
            'Ctrl-0': function (cm) {
                unfoldAll(cm);
            },
            'Ctrl-1': function (cm) {
                foldByLevel(cm, 0);
            },
            'Ctrl-2': function (cm) {
                foldByLevel(cm, 1);
            },
            'Ctrl-3': function (cm) {
                foldByLevel(cm, 2);
            },
            'Ctrl-4': function (cm) {
                foldByLevel(cm, 3);
            },
            'Ctrl-5': function (cm) {
                foldByLevel(cm, 4);
            },
            'Ctrl-6': function (cm) {
                foldByLevel(cm, 5);
            },
            'Ctrl-7': function (cm) {
                foldByLevel(cm, 6);
            },
            'Ctrl-8': function (cm) {
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

    // Better line wrapping. Wrapped lines are based on the indentation
    // of the current line. See this demo:
    //      https://codemirror.net/demo/indentwrap.html
    // Modified slightly to provide an additional hanging indent that is based
    // off of the document's tabSize setting. This mimics how wrapping behaves
    // in Sublime Text.
    const charWidth = cm.defaultCharWidth();
    const basePadding = 4; // Magic number: it is CodeMirror's default value.
    cm.on('renderLine', function (cm, line, el) {
        const tabSize = cm.getOption('tabSize');
        const columns = CodeMirror.countColumn(line.text, null, tabSize);
        const offset = (columns + tabSize) * charWidth;

        el.style.textIndent = '-' + offset + 'px';
        el.style.paddingLeft = (basePadding + offset) + 'px';
    });
    cm.refresh();

    return cm;
}
