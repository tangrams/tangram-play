import CodeMirror from 'codemirror';
import { unfoldAll, foldByLevel } from './codemirror/tools';
import { changeFontSize } from './codemirror/font-size';
import { takeScreenshot } from '../map/map';

/**
 * Creates and exports additional keybinding functionality to CodeMirror.
 *
 * @returns {Object} extraKeysSettings - an object of extra key mappings to
 *              provide to the settings object of CodeMirror.
 */
export function getExtraKeyMap () {
    // Test for whether to use a Ctrl key (Windows) or Cmd key (Mac)
    const isMac = CodeMirror.keyMap.default === CodeMirror.keyMap.macDefault;
    const ctrlKey = isMac ? 'Cmd-' : 'Ctrl-';

    const extraKeysSettings = {
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
    };

    // Set Ctrl- or Cmd- buttons depending on Mac or Windows devices.
    extraKeysSettings[ctrlKey + '-'] = function (cm) {
        changeFontSize(cm, false);
    };
    // Equal (=) maps to the Plus (+)
    extraKeysSettings[ctrlKey + '='] = function (cm) {
        changeFontSize(cm, true);
    };

    return extraKeysSettings;
}
