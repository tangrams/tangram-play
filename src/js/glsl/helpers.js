import _ from 'lodash';
import { editor } from '../editor/editor';

import ColorPicker from '../pickers/color';
import Vec3Picker from '../pickers/vec3';
import Vec2Picker from '../pickers/vec2';
import FloatPicker from '../pickers/float';

export default class Helpers {
    constructor (main) {
        const wrapper = editor.getWrapperElement();

        wrapper.addEventListener('mouseup', (event) => {
            editor.clearGutter('var-in');

            // bail out if we were doing a selection and not a click
            if (editor.somethingSelected()) {
                return;
            }

            // Toggles the trackpad to be off if it's already present.
            if (this.activeModal && this.activeModal.isVisible) {
                this.activeModal.removeModal();
            }

            let cursor = editor.getCursor(true);

            // Exit early if the cursor is not at a token
            let token = editor.getTokenAt(cursor);

            if (token.state.innerMode === null || token.state.innerMode.helperType !== 'glsl') {
                return;
            }

            // see if there is a match on the cursor click
            let match = this.getMatch(cursor);

            if (match) {
                switch (match.type) {
                    case 'color':
                        this.activeModal = newColorPicker(cursor, match);

                        // This picker has an additional toggle for a vec3
                        this.activeModal.on('linkbutton', (color) => {
                            this.activeModal = newVec3Picker(cursor, match);
                        });
                        break;
                    case 'vec3':
                        this.activeModal = newVec3Picker(cursor, match);
                        break;
                    case 'vec2':
                        this.activeModal = newVec2Picker(cursor, match);
                        break;
                    case 'number':
                        this.activeModal = newFloatPicker(cursor, match);
                        break;
                    default:
                        break;
                }
            }
        });
    }

    getMatch (cursor) {
        // Types are put in order of priority
        const types = [{
            name: 'color',
            pattern: /vec[3|4]\([\d|.|,\s]*\)/g
        }, {
            name: 'vec3',
            pattern: /vec3\([-|\d|.|,\s]*\)/g
        }, {
            name: 'vec2',
            pattern: /vec2\([-|\d|.|,\s]*\)/g
        }, {
            name: 'number',
            pattern: /[-]?\d+\.\d+|\d+\.|\.\d+/g
        }];

        const line = editor.getLine(cursor.line);

        for (let type of types) {
            const matches = findAllMatches(type.pattern, line);

            // If there are matches, determine if the cursor is in one of them.
            // If so, return that widget type, otherwise, we test the next type
            // to see if it matches.
            for (let match of matches) {
                let val = match[0];
                let len = val.length;
                let start = match.index;
                let end = match.index + len;
                if (cursor.ch >= start && cursor.ch <= end) {
                    return {
                        type: type.name,
                        start: start,
                        end: end,
                        string: val
                    };
                }
            }
        }

        // If nothing at the cursor location matches a widget type,
        // we reach the end of this function and return undefined.
        return;
    }
}

/**
 * RegExp.exec() method normally returns just one match.
 * However, we do not want to return only the first match
 * because a line may have more than one match and the first one
 * may not be the correct one. This function returns an array of
 * all the matches for the given regular expression.
 *
 * @param {RegExp} pattern - regular expression to test
 * @param {string} string - the string to test against
 */
function findAllMatches (pattern, string) {
    const matches = [];

    // Ensure that the provided RegExp is global.
    // RegExps that are not global will be reset upon each
    // iteration through the while loop below, causing infinite
    // loops to occur. This is merely a guard.
    const re = new RegExp(pattern, 'g');

    // Collect all matches in the string. The loop
    // stops when no matches exist and returns null.
    let match;
    /* eslint-disable no-cond-assign */
    while (match = re.exec(string)) {
        // Clones the match result so we can push it to
        // the array of returned matches. The match result
        // is an array with .index and .input properties,
        // which will also be cloned.
        matches.push(_.clone(match));
    }
    /* eslint-enable no-cond-assign */

    return matches;
}

/**
 * Create and return picker modals
 *
 * @param {Object} cursor - CodeMirror cursor object
 * @param {Object} match - Match information returned from getMatch()
 */
function newColorPicker (cursor, match) {
    const picker = new ColorPicker(match.string, { linkButton: true });

    picker.showAt(editor);
    picker.on('changed', (color) => {
        let newColor = color.getString('vec');
        let start = { line: cursor.line, ch: match.start };
        let end = { line: cursor.line, ch: match.end };
        match.end = match.start + newColor.length;
        editor.replaceRange(newColor, start, end);
    });

    return picker;
}

function newVec3Picker (cursor, match) {
    const picker = new Vec3Picker(match.string);

    picker.showAt(editor);
    picker.on('changed', (dir) => {
        let newDir = dir.getString('vec3');
        let start = { line: cursor.line, ch: match.start };
        let end = { line: cursor.line, ch: match.end };
        match.end = match.start + newDir.length;
        editor.replaceRange(newDir, start, end);
    });

    return picker;
}

function newVec2Picker (cursor, match) {
    const picker = new Vec2Picker(match.string);

    picker.showAt(editor);
    picker.on('changed', (pos) => {
        let newpos = pos.getString();
        let start = { line: cursor.line, ch: match.start };
        let end = { line: cursor.line, ch: match.end };
        match.end = match.start + newpos.length;
        editor.replaceRange(newpos, start, end);
    });

    return picker;
}

function newFloatPicker (cursor, match) {
    const picker = new FloatPicker(match.string);

    picker.showAt(editor);
    picker.on('changed', (string) => {
        let start = { line: cursor.line, ch: match.start };
        let end = { line: cursor.line, ch: match.end };
        match.end = match.start + string.length;
        editor.replaceRange(string, start, end);
    });

    return picker;
}
