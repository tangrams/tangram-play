import EditorIO from './EditorIO';

export default class FileOpen {
    constructor () {
        this.el = constructInvisibleFileInputElement();
    }

    activate () {
        EditorIO.checkSaveStateThen(() => {
            this.el.click();
        });
    }
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
