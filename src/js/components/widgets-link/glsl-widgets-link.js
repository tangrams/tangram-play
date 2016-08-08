import _ from 'lodash';
import { editor } from '../../editor/editor';

import React from 'react';
import ReactDOM from 'react-dom';
import WidgetLinkVec2 from './widget-link-vec2.react';
import WidgetLinkNumber from './widget-link-number.react';
import WidgetColor from '../widgets/widget-color/widget-color.react';

export default class GlslWidgetsLink {
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

            // If the user clicks somewhere that is not where the cursor is
            // This checks for cases where a user clicks on a normal widget (not glsl) but the cursor is over a shader block
            if (cursorAndClickDontMatch(cursor, event)) {
                return;
            }

            // Exit early if the cursor is not at a token
            let token = editor.getTokenAt(cursor);

            // Assume that we should trigger a widget-link
            let shouldTriggerWidget = false;

            // If it is not a glsl widget, then for now set our boolean to FALSE
            if (token.state.innerMode !== null && token.state.innerMode.helperType === 'glsl') {
                shouldTriggerWidget = true;
            }
            // But if it is within a defines, then set to TRUE again
            if (token.state.nodes[0].address !== null && token.state.nodes[0].address.indexOf('shaders:defines') !== -1) {
                shouldTriggerWidget = true;
            }

            // If FALSE then return, we do not need to render a widget-link
            if (!shouldTriggerWidget) {
                return;
            }

            // see if there is a match on the cursor click
            let match = this.getMatch(cursor);

            if (match) {
                let widgetlink = document.getElementById('widget-links');

                switch (match.type) {
                    case 'vec3':
                        // Cleaning up the value we send to the WidgetColor
                        let cleanNum = match.string.substr(4);
                        cleanNum = cleanNum.replace(/[()]/g, '');
                        cleanNum = '[' + cleanNum + ']';

                        ReactDOM.render(<WidgetColor display={true} cursor={cursor} match={match} value={cleanNum} shader={true}/>, widgetlink);
                        break;
                    case 'vec2':
                        ReactDOM.render(<WidgetLinkVec2 display={true} cursor={cursor} match={match} value={match.string}/>, widgetlink);
                        break;
                    case 'number':
                        ReactDOM.render(<WidgetLinkNumber display={true} cursor={cursor} match={match} value={match.string}/>, widgetlink);
                        break;
                    default:
                        break;
                }
            }
        });
    }

    getMatch (cursor) {
        // Types are put in order of priority
        const types = [
            // Disabling the color widget that used to appear together with vec3
            // {
            // name: 'color',
            // pattern: /vec[3|4]\([\d|.|,\s]*\)/g
            // },
            {
                name: 'vec3',
                pattern: /vec3\([-|\d|.|,\s]*\)/g
            },
            {
                name: 'vec2',
                pattern: /vec2\([-|\d|.|,\s]*\)/g
            },
            {
                name: 'number',
                pattern: /[-]?\d+\.\d+|\d+\.|\.\d+/g
            }
        ];

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
 * Find whether the current CodeMirror cursor and a given click event match up in the
 * location on the page
 */
function cursorAndClickDontMatch (cursor, event) {
    const cursorCoords = editor.cursorCoords(true, 'window');
    const cursorX = cursorCoords.left;
    const cursorY = cursorCoords.top;

    const clickX = event.x;
    const clickY = event.y - 10; // 10 seems to be the height of the cursor

    const OFFSET = 10; // Space to check around click and cursor

    // If cursorX is not between a minimum and max bounds then they do NOT match. Return TRUE
    if (!(cursorX >= (clickX - OFFSET) && cursorX <= (clickX + OFFSET))) {
        return true;
    }

    if (!(cursorY >= (clickY - OFFSET) && cursorY <= (clickY + OFFSET))) {
        return true;
    }

    return false;
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
