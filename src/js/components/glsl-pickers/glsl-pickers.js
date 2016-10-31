import React from 'react';
import ReactDOM from 'react-dom';
import { clone } from 'lodash';
import { editor } from '../../editor/editor';
import Vec2Picker from './Vec2Picker';
import NumberPicker from './NumberPicker';
import ColorBookmark from '../pickers/color/ColorBookmark';

/**
 * Find whether the current CodeMirror cursor and a given click event match up in the
 * location on the page
 */
function cursorAndClickDontMatch(cursor, event) {
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
function findAllMatches(pattern, string) {
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
    matches.push(clone(match));
  }
  /* eslint-enable no-cond-assign */

  return matches;
}

function getMatch(cursor) {
  // Types are put in order of priority
  const types = [
    {
      name: 'vec4',
      pattern: /vec4\([-|\d|.|,\s]*\)/g,
    },
    {
      name: 'vec3',
      pattern: /vec3\([-|\d|.|,\s]*\)/g,
    },
    {
      name: 'vec2',
      pattern: /vec2\([-|\d|.|,\s]*\)/g,
    },
    {
      name: 'number',
      pattern: /[-]?\d+\.\d+|\d+\.|\.\d+/g,
    },
  ];

  const line = editor.getLine(cursor.line);

  for (const type of types) {
    const matches = findAllMatches(type.pattern, line);

    // If there are matches, determine if the cursor is in one of them.
    // If so, return that widget type, otherwise, we test the next type
    // to see if it matches.
    for (const match of matches) {
      const val = match[0];
      const len = val.length;
      const start = match.index;
      const end = match.index + len;
      if (cursor.ch >= start && cursor.ch <= end) {
        return {
          type: type.name,
          start,
          end,
          string: val,
        };
      }
    }
  }

  // If nothing at the cursor location matches a widget type,
  // we reach the end of this function and return undefined.
  return undefined;
}

export function initGlslPickers() {
  const wrapper = editor.getWrapperElement();

  wrapper.addEventListener('mouseup', (event) => {
    // bail out if we were doing a selection and not a click
    if (editor.somethingSelected()) {
      return;
    }

    const cursor = editor.getCursor(true);

    // If the user clicks somewhere that is not where the cursor is
    // This checks for cases where a user clicks on a normal picker trigger
    // (not glsl) but the cursor is over a shader block
    if (cursorAndClickDontMatch(cursor, event)) {
      return;
    }

    // Exit early if the cursor is not at a token
    const token = editor.getTokenAt(cursor);

    // Assume that we should trigger a picker
    let shouldTriggerPicker = false;

    // If it is not a glsl picker, then for now set our boolean to FALSE
    if (token.state.innerMode !== null && token.state.innerMode.helperType === 'glsl') {
      shouldTriggerPicker = true;
    }
    // But if it is within a defines, then set to TRUE again
    if (token.state.nodes[0] !== null && token.state.nodes[0].address.indexOf('shaders:defines') !== -1) {
      shouldTriggerPicker = true;
    }

    // If FALSE then return, we do not need to render a picker
    if (!shouldTriggerPicker) {
      return;
    }

    // see if there is a match on the cursor click
    const match = getMatch(cursor);

    if (match) {
      const glslPickerMountPoint = document.getElementById('glsl-pickers');

      switch (match.type) {
        case 'vec4':
        case 'vec3':
          {
            // Cleaning up the value we send to the ColorBookmark
            let cleanNum = match.string.substr(4);
            cleanNum = cleanNum.replace(/[()]/g, '');
            cleanNum = `[${cleanNum}]`;

            if (match.type === 'vec4') {
              ReactDOM.render(
                <ColorBookmark
                  display
                  cursor={cursor}
                  match={match}
                  value={cleanNum}
                  shader
                  vec="vec4"
                />,
                glslPickerMountPoint
              );
            } else {
              ReactDOM.render(
                <ColorBookmark
                  display
                  cursor={cursor}
                  match={match}
                  value={cleanNum}
                  shader
                  vec="vec3"
                />,
                glslPickerMountPoint
              );
            }
            break;
          }
        case 'vec2':
          ReactDOM.render(
            <Vec2Picker
              display
              cursor={cursor}
              match={match}
              value={match.string}
            />,
            glslPickerMountPoint
          );
          break;
        case 'number':
          ReactDOM.render(
            <NumberPicker
              display
              cursor={cursor}
              match={match}
              value={match.string}
            />,
            glslPickerMountPoint
          );
          break;
        default:
          break;
      }
    }
  });
}
