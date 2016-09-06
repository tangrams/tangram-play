/**
 * CodeMirror setup. Declare CodeMirror addons and generic functionality here.
 *
 * @exports initCodeMirror
 */

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
import 'codemirror/addon/edit/trailingspace';
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

// Import custom keymap with additional Tangram Play functionality
import { getExtraKeyMap } from './keymap';

// Starting indent size. Use this when a hard-coded value at CodeMirror
// initialization is necessary. Otherwise, when a CodeMirror instance is
// available, use cm.getOption('indentUnit') to retrieve the current value.
const INDENT_UNIT = 4;

// Export CodeMirror instance
/**
 * Initializes CodeMirror.
 *
 * @public
 * @returns {CodeMirror} an instance of the CodeMirror editor.
 */
export function initCodeMirror(el) {
    let autofocus = true;

    // If we're using an embedded version of play, we don't want the CodeMirror instance to focus by default
    // since presumably we'll be embedding it within another page
    if (window.isEmbedded) {
        autofocus = false;
    }

    const cm = new CodeMirror(el, {
        mode: 'text/x-yaml-tangram',
        theme: 'tangram',
        indentUnit: INDENT_UNIT,
        rulers: createRulersOption(),
        keyMap: 'sublime',
        extraKeys: getExtraKeyMap(),
        lineWrapping: true,
        lineNumbers: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        foldGutter: {
            rangeFinder: CodeMirror.fold.indent,
        },
        styleActiveLine: true,
        showCursorWhenSelecting: true,
        autofocus,
        showTrailingSpace: true,
        matchBrackets: true,
        autoCloseBrackets: true,
    });

    // Better line wrapping. Wrapped lines are based on the indentation
    // of the current line. See this demo:
    //      https://codemirror.net/demo/indentwrap.html
    // Modified slightly to provide an additional hanging indent that is based
    // off of the document's indentUnit setting. This mimics how wrapping behaves
    // in Sublime Text.
    cm.on('renderLine', function (cm, line, el) {
        const indentUnit = cm.getOption('indentUnit');
        const charWidth = cm.defaultCharWidth();
        const columns = CodeMirror.countColumn(line.text, null, indentUnit);
        const offset = (columns + indentUnit) * charWidth;
        const basePadding = 4; // Magic number: it is CodeMirror's default value.

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
 * @protected
 * @param {Number} indentSize - the number of spaces to add rulers at.
 *              Defaults to INDENT_UNIT, defined above.
 * @param {Number} amount - number of rulers to add, total. Defaults to 10.
 * @returns {Object} a valid value for CodeMirror's `rulers` option.
 */
function createRulersOption(indentSize = INDENT_UNIT, amount = 10) {
    const rulers = [];
    for (let i = 1; i < amount; i++) {
        rulers.push({ column: i * indentSize });
    }
    return rulers;
}
