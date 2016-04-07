/**
 * Creates an "open from filesystem" dialog box using the browser.
 *
 * JavaScript does not have access to the host system's filesystem.
 * We must go through the browser. The way this works is by constructing
 * an invisible file input element in memory, and then triggering a click
 * on it, which activates the browser's open dialog.
 */
import EditorIO from '../editor/io';

const el = constructInvisibleFileInputElement();

export function openLocalFile () {
    EditorIO.checkSaveStateThen(() => {
        el.click();
    });
}

function constructInvisibleFileInputElement () {
    let fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', 'text/x-yaml');
    fileSelector.style.display = 'none';
    fileSelector.addEventListener('change', function (event) {
        const files = event.target.files;
        EditorIO.loadContentFromFile(files[0]);
    });
    return fileSelector;
}
