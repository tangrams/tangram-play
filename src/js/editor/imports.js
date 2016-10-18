/* eslint-disable indent */
import { editor } from './editor';
import { isAbsoluteUrl } from '../tools/helpers';
import store from '../store';

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
      let urlString = token.state.string.replace(/^\s*(-|import:)\s*/, '').trim();

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

      // This is the URL string as the import value!
      // console.log(urlString);

      // Next: fetch contents of this file
      // If successful, add it to the files array in state.
    }
  });
}
