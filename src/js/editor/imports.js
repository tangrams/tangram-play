import { editor, parsedYAMLDocument } from './editor';
import { isAbsoluteUrl, splitUrlIntoFilenameAndBasePath } from '../tools/helpers';
import { showErrorModal } from '../modals/ErrorModal';
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

  // Returns true if the node value is a scalar, and the key address for this value is 'import'
  // We don't want to return true if we're inside an import node but at the
  // sequence node level
  const address = getKeyAddressForNode(node);
  if (address === 'import' && node.kind === 0) return true;

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

// Let's work on finding scene imports.
// TODO: This is not a final API; this is just for testing purposes.
export function initSceneImportDetector() {
  const wrapper = editor.getWrapperElement();

  wrapper.addEventListener('mouseup', (event) => {
    // Currently scoped to admin-users only or local development environment.
    // Bail if neither is true
    if (window.location.hostname !== 'localhost' && store.getState().user.admin === false) {
      return;
    }

    const doc = editor.getDoc();

    // Bail if we were doing a selection and not a click
    if (doc.somethingSelected()) return;

    const cursorPos = doc.getCursor();
    const cursorIndex = doc.indexFromPos(cursorPos); // -> Number
    const node = parsedYAMLDocument.getNodeAtIndex(cursorIndex);
    const isImportBlock = isImportValue(node);

    if (isImportBlock) {
      let urlString = node.value;

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
            throw new Error('did not work');
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
        })
        .catch((error) => {
          showErrorModal(error.message);
        });
    }
  });
}
