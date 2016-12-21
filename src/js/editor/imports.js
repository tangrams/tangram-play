import { editor, parsedYAMLDocument } from './editor';
import { clickIsAtCursorPosition } from './codemirror/tools';
import { isAbsoluteUrl, splitUrlIntoFilenameAndBasePath } from '../tools/helpers';
import { addError } from './errors';
import { getKeyAddressForNode } from './yaml-ast';

// Redux
import store from '../store';
import { ADD_FILE } from '../store/actions';

/**
 * Is the provided scalar value node an import?
 *
 * @param {YAML-AST node} node
 * @returns {Boolean}
 */
function isImportValue(node) {
  // Returns false if not in a node, or is a top-level node
  if (!node || !node.parent) return false;

  // Returns false if node is not a scalar - e.g. we're inside an import node,
  // but at the sequence node level.
  if (node.kind !== 0) return false;

  // Returns true if the key address for this value is 'import'
  const address = getKeyAddressForNode(node);
  if (address === 'import') return true;

  // All other cases, return false
  return false;
}

// Check the files array to see if a file of "key" property is open already
function isAlreadyOpened(key) {
  const files = store.getState().scene.files;
  let found = false;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.key && file.key === key) {
      found = true;
      break;
    }
  }
  return found;
}

let urlString;
let cursorPos;

function handleImportValue(node, doc, incomingCursorPos) {
  urlString = node.value;
  cursorPos = incomingCursorPos;

  const startPosition = doc.posFromIndex(node.startPosition);
  const startCharCoords = editor.charCoords(startPosition);
  const el = document.querySelector('.editor-context-menu');
  el.style.display = 'block';
  el.style.left = `${startCharCoords.left}px`;
  el.style.top = `${startCharCoords.bottom}px`;
}

function openLink(event) {
  // TODO: url strings that are passed in as globals

  // Attach the file's base path if it looks like a relative URL!
  // Relative paths must be resolved in relationship to current FILE,
  // not the current SCENE. Imagine a scene that imports an external file,
  // which then imports a file relative to it; attaching the scene's base
  // path will break it.
  if (isAbsoluteUrl(urlString) === false) {
    // Get the files's base path if present
    const scene = store.getState().scene;

    const activeFile = scene.files[scene.activeFileIndex];
    const basePath = activeFile.basePath || scene.originalBasePath;
    const intermediaryUrlResolver = new window.URL(urlString, basePath);
    urlString = intermediaryUrlResolver.href;
  }

  // if the urlString is already opened, don't open it again
  if (isAlreadyOpened(urlString) === true) return;

  // Next: fetch contents of this file
  window.fetch(urlString)
    .then((response) => {
      if (!response.ok) {
        const error = new Error(`HTTP error code ${response.status}: Could not open ${urlString}`);
        error.line = cursorPos.line;
        throw error;
      }

      // Assume text content of file; don't use this to open other
      // zips, or images etc
      return response.text();
    })
    .then((contents) => {
      // If successful, add it to the files array in state.
      const urlParts = splitUrlIntoFilenameAndBasePath(urlString);
      const file = {
        key: urlString,
        basePath: urlParts[0],
        filename: urlParts[1],
        contents,
        readOnly: true,
      };
      store.dispatch({
        type: ADD_FILE,
        file,
      });

      // finally (todo: don't do this here)
      const el = document.querySelector('.editor-context-menu');
      el.style.display = 'none';
    })
    .catch((error) => {
      // Error message is thrown as stringified JSON, parse it first
      addError({
        type: 'error',
        line: error.line,
        message: error.message,
      });
    });
}

// Let's work on finding scene imports.
// TODO: This is not a final API; this is just for testing purposes.
export function initContextSensitiveClickEvents() {
  // Currently scoped to admin-users only or local development environment.
  // Bail if neither is true
  if (window.location.hostname !== 'localhost' && store.getState().user.admin === false) {
    return;
  }

  const wrapper = editor.getWrapperElement();

  wrapper.addEventListener('mouseup', (event) => {
    const doc = editor.getDoc();

    // Bail if we were doing a selection and not a click
    if (doc.somethingSelected()) return;

    // Bail if click did not occur near the cursor position
    if (!clickIsAtCursorPosition(editor, event)) return;

    const cursor = doc.getCursor();
    const cursorIndex = doc.indexFromPos(cursor); // -> Number
    const node = parsedYAMLDocument.getNodeAtIndex(cursorIndex);
    const isImportBlock = isImportValue(node);

    if (isImportBlock) {
      handleImportValue(node, doc, cursor);
    } else {
      const el = document.querySelector('.editor-context-menu');
      el.style.display = 'none';
    }
  });

  // listener for links
  const contextLink = document.querySelector('.editor-context-menu li');
  contextLink.addEventListener('click', openLink, true);

  // Shut down the context menu on other interactions
  // todo: move elsewhere, react flow
  window.addEventListener('mousedown', (event) => {
    if (event.target.textContent !== 'Open in new tab (read-only)') {
      const el = document.querySelector('.editor-context-menu');
      el.style.display = 'none';
    }
  });

  editor.on('scroll', (event) => {
    const el = document.querySelector('.editor-context-menu');
    el.style.display = 'none';
  });
}
