import { editor, parsedYAMLDocument } from './editor';
import { getPositionsForNode } from './yaml-ast';
import { tangramLayer } from '../map/map';

// Redux
import store from '../store';
import { ADD_ERROR, REMOVE_ERROR, CLEAR_ERRORS } from '../store/actions';

const lineWidgets = [];
const blockErrors = new Set();

const SCENE_ERRORS = {
  MAPZEN_API_KEY_MISSING: {
    type: 'warning',
    name: 'MAPZEN_API_KEY_MISSING',
    message: 'This scene uses at least one Mapzen tile service without an API key. Keyless requests will be rejected after March 1, 2017. Please add an API key from your Mapzen developer account as soon as possible.',
    link: 'https://mapzen.com/blog/api-keys-required/',
  },
};

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

  // Get the root document, if it's not the current document in editor.
  // If it's not the current document, get it from the scene buffer.
  const scene = store.getState().scene;
  let doc;
  if (scene.activeFileIndex === scene.rootFileIndex) {
    doc = editor.getDoc();
  } else {
    // Note; adding lineWidgets to a buffer doc doesn't get restored.
    doc = scene.files[scene.rootFileIndex].buffer;
  }

  const lineWidget = doc.addLineWidget(line, node, {
    coverGutter: false,
    noHScroll: true,
  });

  lineWidgets.push(lineWidget);
}

export function clearAllErrors() {
  // Early return if errors are already cleared, this avoids a lot of extra
  // work and polluting the Redux action log
  if (lineWidgets.length === 0) return;

  for (let i = 0, j = lineWidgets.length; i < j; i++) {
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
 * @param {Object|string} error - error object to add. It should be of the signature
 *          {
 *            type: 'error', // {string} 'error' or 'warning'
 *            name: // {string} identifier of error. optional.
 *            message: // {string} The message to display
 *            link: // {string} a URL for a "learn more" link.
 *            line: // {number} A line number, if known.
 *          }
 *          This can also be a string, e.g. "MAPZEN_API_KEY_MISSING" which
 *          will look up the error object from a central `SCENE_ERRORS` object.
 */
export function addError(error) {
  let errorObj;
  if (error instanceof Object) {
    errorObj = error;
  } else if (typeof error === 'string') {
    errorObj = SCENE_ERRORS[error];
  }
  if (errorObj) {
    store.dispatch({
      type: ADD_ERROR,
      error: errorObj,
    });
  }
}

/**
 * Remove an error matching `name`.
 *
 * @param {string} error - error to remove, matching the `name` property of
 *          an error object.
 */
export function removeError(error) {
  store.dispatch({
    type: REMOVE_ERROR,
    identity: {
      name: error,
    },
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

/**
 * Handles a shader error with a known block
 *
 * @param {Object} error - the error to handle
 * @param {Object} errorObj - the original error object from Tangram
 */
function handleShaderErrorWithBlock(error, errorObj) {
  const style = error.block.scope;

  // Skip generic errors not originating in style-sheet
  if (style === 'ShaderProgram') return;

  const block = error.block;

  // De-dupe errors per block
  if (blockErrors.has(JSON.stringify(block))) return;

  const address = `styles:${style}:shaders:blocks:${block.name}`;
  const node = parsedYAMLDocument.getNodeAtKeyAddress(address);
  const pos = getPositionsForNode(node, editor.getDoc());

  const data = {
    type: 'warning',
    line: (node) ? pos.from.line + 1 + block.line : undefined,
    message: `${errorObj.message}: ${error.message}`,
    originalError: errorObj,
  };

  if (node) {
    blockErrors.add(JSON.stringify(block)); // track unique errors
  }

  addError(data);
}

/**
 * Handles a shader error where the block is not known
 *
 * @param {Object} error - the error to handle
 * @param {Object} errorObj - the original error object from Tangram
 */
function handleShaderErrorWithoutBlock(error, errorObj) {
  const data = {
    type: 'warning',
    message: `${errorObj.message}: ${error.message} [The line number for this error is unknown.]`,
    originalError: errorObj,
  };

  addError(data);
}

function addTangramWarning(errorObj) {
  switch (errorObj.type) {
    case 'styles':
      {
        // Only show first error, cascading errors can be confusing
        const errors = errorObj.shader_errors.slice(0, 1);

        for (let i = 0; i < errors.length; i++) {
          // There are two kinds of shader error.
          // Usually, the shader block is known. This is provided as a `block`
          // property on the error. This allows us to track down where the
          // error is.
          // There is a second type of syntax error that causes the block to
          // be unknown. One example of this is when the last line of the
          // shader doesn't have a semicolon, so the error "overflows" beyond
          // it to the next line, which is not considered to be part of the block.
          const error = errors[i];
          if (error.block) {
            handleShaderErrorWithBlock(error, errorObj);
          } else {
            handleShaderErrorWithoutBlock(error, errorObj);
          }
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
  editor.on('changes', (cm, changes) => {
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
