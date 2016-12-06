import { editor, getNodesForAddress } from './editor';
import { tangramLayer } from '../map/map';

// Redux
import store from '../store';
import { ADD_ERROR, CLEAR_ERRORS } from '../store/actions';

const lineWidgets = [];
const blockErrors = new Set();

/**
 * Creates DOM element to be injected into the editor and display as an error.
 *
 * @param {string} type - either 'error' or 'warning'
 * @param {string} message - the string to display in the error
 */
function createErrorLineElement(type, message) {
  let iconTypeClass;
  if (type === 'error') {
    iconTypeClass = 'btm bt-exclamation-triangle error-icon';
  } else if (type === 'warning') {
    iconTypeClass = 'btm bt-exclamation-circle warning-icon';
  }

  let displayText = message;
  if (!displayText || displayText.length === 0) {
    displayText = `Unspecified ${type}.`;
  }

  const node = document.createElement('div');
  node.className = type;

  const icon = document.createElement('span');
  icon.className = iconTypeClass;

  node.appendChild(icon);
  node.appendChild(document.createTextNode(displayText));

  return node;
}

/**
 * Creates CodeMirror line widget to display an error below a line.
 *
 * @param {string} type - either 'error' or 'warning'
 * @param {Number} line - the line number to display under
 * @param {string} message - the string to display in the error
 */
function createLineWidget(type, line, message) {
  const node = createErrorLineElement(type, message);

  // Do not add line widgets that already exist
  for (let i = 0, j = lineWidgets.length; i < j; i++) {
    const lineNo = lineWidgets[i].line.lineNo();
    const textContent = lineWidgets[i].node.textContent;
    if (line === lineNo && message === textContent) return;
  }

  const lineWidget = editor.addLineWidget(line, node, {
    coverGutter: false,
    noHScroll: true,
  });

  lineWidgets.push(lineWidget);
}

export function clearAllErrors() {
  for (let i = 0; i < lineWidgets.length; i++) {
    editor.removeLineWidget(lineWidgets[i]);
  }
  lineWidgets.length = 0;
  blockErrors.clear();

  store.dispatch({
    type: CLEAR_ERRORS,
  });
}

/**
 * Add a generic error.
 *
 * @param {Object} error - error object to add. It should be of the signature
 *          {
 *            type: 'error',
 *            message: // {string} The message to display
 *            line: // {number} A line number, if known.
 *          }
 */
export function addError(error) {
  store.dispatch({
    type: ADD_ERROR,
    error,
  });
}

/**
 * Handles error object returned by Tangram's error event.
 *
 * @param {Object} errorObj - error object from Tangram. Its signature will
 *          vary depending on the `errorObj.type` property.
 */
function addTangramError(errorObj) {
  let error;

  switch (errorObj.type) {
    case 'yaml':
      {
        const line = errorObj.error.mark.line;
        const message = errorObj.error.reason;

        error = {
          type: 'error',
          line,
          message,
          originalError: errorObj,
        };

        break;
      }
      // case 'scene':
    case 'scene_import':
      // errorObj contains these properties:
      //      `message` - handy error from Tangram
      //      `url` - the url that could not be loaded
      // we do not have a line number on which the error exists
      // import values are returned as fully qualified urls, so we cannot
      // check the value itself
      error = {
        type: 'error',
        message: errorObj.message,
        originalError: errorObj,
      };

      break;
      // Default case handles unknown error types or undefined types, which
      // can happen if Tangram Play itself (and not Tangram) throws an error
      // when Tangram is executing a Promise and catches a Tangram Play error.
    default:
      error = {
        type: 'error',
        message: errorObj.message,
        originalError: errorObj,
      };
      break;
  }

  addError(error);
}

function addTangramWarning(errorObj) {
  switch (errorObj.type) {
    case 'styles':
      {
        // Only show first error, cascading errors can be confusing
        const errors = errorObj.shader_errors.slice(0, 1);

        for (let i = 0; i < errors.length; i++) {
          const style = errors[i].block.scope;

          // Skip generic errors not originating in style-sheet
          if (style === 'ShaderProgram') {
            continue; // eslint-disable-line no-continue
          }

          const block = errors[i].block;

          // De-dupe errors per block
          if (blockErrors.has(JSON.stringify(block))) {
            continue; // eslint-disable-line no-continue
          }

          const address = `styles:${style}:shaders:blocks:${block.name}`;
          const node = getNodesForAddress(address);
          const message = errors[i].message;

          const warning = {
            type: 'warning',
            line: (node) ? node.range.from.line + 1 + block.line : undefined,
            message,
            originalError: errorObj,
          };

          if (node) {
            blockErrors.add(JSON.stringify(block)); // track unique errors
          }

          store.dispatch({
            type: ADD_ERROR,
            error: warning,
          });
        }

        break;
      }
      // Handle unknown warning types.
    default:
      store.dispatch({
        type: ADD_ERROR,
        error: {
          type: 'warning',
          message: errorObj.message,
          originalError: errorObj,
        },
      });

      break;
  }
}

/**
 * Depends on CodeMirror editor and Tangram layer being present.
 */
export function initErrorsManager() {
  editor.on('changes', (cm, changesObjs) => {
    clearAllErrors();
  });

  // Subscribe to error events from Tangram
  // See documentation: https://mapzen.com/documentation/tangram/Javascript-API/#error-and-warning
  tangramLayer.scene.subscribe({
    error: (event) => {
      addTangramError(event);
    },
    warning: (event) => {
      addTangramWarning(event);
    },
  });

  // Render line widgets from errors store
  store.subscribe(() => {
    const errors = store.getState().errors.errors;

    // Generate line errors for each error that has a line number.
    errors.forEach((item) => {
      // Do not check for falsy values; 0 is a valid line number.
      if (typeof item.line === 'number') {
        createLineWidget(item.type, item.line, item.message);
      }
    });
  });
}
