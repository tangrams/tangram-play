// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror modes
import 'codemirror/mode/javascript/javascript';

// Import Tangram custom modes
import './codemirror/yaml-tangram';
import './codemirror/hint-tangram';

// Import CodeMirror addons
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

// Import Codemirror keymap
import 'codemirror/keymap/sublime';

// Import everything else
import { unfoldAll, foldByLevel } from './codemirror/tools';
import { takeScreenshot } from '../map/map';

// Starting indent size. Use this when a hard-coded value at CodeMirror
// initialization is necessary. Otherwise, when a CodeMirror instance is
// available, use cm.getOption('indentUnit') to retrieve the current value.
const INDENT_UNIT = 4;

// Export CodeMirror instance
export const editor = initCodeMirror();

// Debug
window.editor = editor;

/**
 * Initializes CodeMirror.
 *
 * @returns {CodeMirror} an instance of the CodeMirror editor.
 */
function initCodeMirror () {
    const el = document.getElementById('editor');
    const cm = new CodeMirror(el, {
        mode: 'text/x-yaml-tangram',
        theme: 'tangram',
        indentUnit: INDENT_UNIT,
        rulers: createRulersOption(),
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
        lineWrapping: true,
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        foldGutter: {
            rangeFinder: CodeMirror.fold.indent
        },
        styleActiveLine: true,
        showCursorWhenSelecting: true,
        autofocus: true,
        matchBrackets: true,
        autoCloseBrackets: true
    });

    // Better line wrapping. Wrapped lines are based on the indentation
    // of the current line. See this demo:
    //      https://codemirror.net/demo/indentwrap.html
    // Modified slightly to provide an additional hanging indent that is based
    // off of the document's indentUnit setting. This mimics how wrapping behaves
    // in Sublime Text.
    const charWidth = cm.defaultCharWidth();
    const basePadding = 4; // Magic number: it is CodeMirror's default value.
    cm.on('renderLine', function (cm, line, el) {
        const indentUnit = cm.getOption('indentUnit');
        const columns = CodeMirror.countColumn(line.text, null, indentUnit);
        const offset = (columns + indentUnit) * charWidth;

        el.style.textIndent = '-' + offset + 'px';
        el.style.paddingLeft = (basePadding + offset) + 'px';
    });
    cm.refresh();

    return cm;
}

/**
 * Sets up a series of CodeMirror rulers. Depends on addon `display/rulers.js`.
 * See documetation: https://codemirror.net/doc/manual.html#addon_rulers
 *
 * CodeMirror's `rulers` option expects an array of objects where the
 * `column` property is the column at which to add a ruler. There does not
 * appear to be a way to specify rulers only at CodeMirror's current `indentSize`
 * property, so this function returns an array of ruler positions given an
 * arbitrary indent spacing. If the editor's indent spacing changes, CodeMirror's
 * `rulers` option should be set to the correct `indentSize` value.
 *
 * @param {Number} indentSize - the number of spaces to add rulers at.
 *              Defaults to INDENT_UNIT, defined above.
 * @param {Number} amount - number of rulers to add, total. Defaults to 10.
 * @returns {Object} a valid value for CodeMirror's `rulers` option.
 */
function createRulersOption (indentSize = INDENT_UNIT, amount = 10) {
    const rulers = [];
    for (let i = 1; i < amount; i++) {
        rulers.push({ column: i * indentSize });
    }
    return rulers;
}
