/* eslint-disable indent */
import { editor } from './editor';
import { isAbsoluteUrl, getFilenameFromUrl } from '../tools/helpers';
import { showErrorModal } from '../modals/ErrorModal';

// Redux
import store from '../store';
import { ADD_FILE } from '../store/actions';

// TODO: this does not know what to do if imports are all on one line, e.g. flow notation
function normalizeImportValue(string) {
    // Truncate anything beyond what looks like a comment (the `#` mark)
    // Note this will truncate URL strings with hash fragments, but why are
    // importing those anyway?
    let urlString = string.split('#')[0];

    // Replace what strings start with (the collection marker `-` or the
    // `import:` key), remove whitespace
    urlString = urlString.replace(/^\s*(-|import:)\s*/, '').trim();

    // Remove quotation marks around the value, if present
    urlString = urlString.replace(/^('|")?/, '').replace(/('|")?$/, '').trim();

    return urlString;
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
    // bail out if we were doing a selection and not a click
    if (editor.somethingSelected()) {
      return;
    }

    const cursor = editor.getCursor(true);

    // If the user clicks somewhere that is not where the cursor is
    // This checks for cases where a user clicks on a normal picker trigger
    // (not glsl) but the cursor is over a shader block
    // if (cursorAndClickDontMatch(cursor, event)) {
    //   return;
    // }

    const token = editor.getTokenAt(cursor);
    const isImportBlock = token.state.keyStack[token.state.keyStack.length - 1] === 'import';
    if (isImportBlock) {
      // Using the string of the line, determine the url of the imported scene.
      // Note that `nodes` array will not always contain a URL for its `value`
      // property because `import` may be a YAML collections and we cannot parse
      // YAML collections yet.
      let urlString = normalizeImportValue(token.state.string);

      // If the url string is blank at this point (which can happen on a line
      // whose value is just "import:") then bail
      if (urlString === '') return;

      // TODO: url strings that are passed in as globals

      // Attach the scene base path if it looks like a relative URL!
      if (isAbsoluteUrl(urlString) === false) {
        // Get the scene's base path
        const scene = store.getState().scene;
        const basePath = scene.originalBasePath;
        urlString = `${basePath}${urlString}`;
      }

      // if the urlString is already opened, don't open it again
      if (isAlreadyOpened(urlString) === true) return;

      // Next: fetch contents of this file
      window.fetch(urlString)
        .then(response => {
          if (!response.ok) {
            throw new Error('did not work');
          }

          // Assume text content of file; don't use this to open other
          // zips, or images etc
          return response.text();
        })
        .then(contents => {
          // If successful, add it to the files array in state.
          const filename = getFilenameFromUrl(urlString);
          const file = {
            key: urlString,
            filename,
            contents,
            readOnly: true,
          };
          store.dispatch({
            type: ADD_FILE,
            file,
        });
        })
        .catch(error => {
          showErrorModal(error.message);
        });
    }
  });
}
