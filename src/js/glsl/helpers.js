import _ from 'lodash';
import { editor } from '../tangram-play';

import ColorPicker from '../pickers/color';
import Vec3Picker from '../pickers/vec3';
import Vec2Picker from '../pickers/vec2';
import FloatPicker from '../pickers/float';

export default class Helpers {
    constructor (main) {
        // EVENTS
        let wrapper = editor.getWrapperElement();
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

            if (token.state.localMode === null || token.state.localMode.helperType !== 'glsl') {
                return;
            }

            // see if there is a match on the cursor click
            let match = this.getMatch(cursor);

            if (match) {
                switch (match.type) {
                    case 'color':
                        this.activeModal = new ColorPicker(match.string, { link_button: true });
                        this.activeModal.showAt(editor);
                        this.activeModal.on('changed', (color) => {
                            let newColor = color.getString('vec');
                            let start = { line: cursor.line, ch: match.start };
                            let end = { line: cursor.line, ch: match.end };
                            match.end = match.start + newColor.length;
                            editor.replaceRange(newColor, start, end);
                        });

                        this.activeModal.on('link_button', (color) => {
                            this.activeModal = new Vec3Picker(color.getString('vec'));
                            this.activeModal.showAt(editor);
                            this.activeModal.on('changed', (dir) => {
                                let newDir = dir.getString('vec3');
                                let start = { line: cursor.line, ch: match.start };
                                let end = { line: cursor.line, ch: match.end };
                                match.end = match.start + newDir.length;
                                editor.replaceRange(newDir, start, end);
                            });
                        });
                        break;
                    case 'vec3':
                        this.activeModal = new Vec3Picker(match.string);
                        this.activeModal.showAt(editor);
                        this.activeModal.on('changed', (dir) => {
                            let newDir = dir.getString('vec3');
                            let start = { line: cursor.line, ch: match.start };
                            let end = { line: cursor.line, ch: match.end };
                            match.end = match.start + newDir.length;
                            editor.replaceRange(newDir, start, end);
                        });
                        break;
                    case 'vec2':
                        this.activeModal = new Vec2Picker(match.string);
                        this.activeModal.showAt(editor);
                        this.activeModal.on('changed', (pos) => {
                            let newpos = pos.getString();
                            let start = { line: cursor.line, ch: match.start };
                            let end = { line: cursor.line, ch: match.end };
                            match.end = match.start + newpos.length;
                            editor.replaceRange(newpos, start, end);
                        });
                        break;
                    case 'number':
                        this.activeModal = new FloatPicker(match.string);
                        this.activeModal.showAt(editor);
                        this.activeModal.on('changed', (string) => {
                            let start = { line: cursor.line, ch: match.start };
                            let end = { line: cursor.line, ch: match.end };
                            match.end = match.start + string.length;
                            editor.replaceRange(string, start, end);
                        });
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

            // If there are matches, determine if the cursor
            // is in one of them.
            // If so, return that widget type, otherwise,
            // we test the next type to see if it matches.
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
 * @param {RegExp} regular expression to test
 * @param {string} the string to test against
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
    while (match = re.exec(string)) {
        // Clones the match result so we can push it to
        // the array of returned matches. The match result
        // is an array with .index and .input properties,
        // which will also be cloned.
        matches.push(_.clone(match));
    }

    return matches;
}
