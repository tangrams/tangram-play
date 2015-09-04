'use strict';

import TangramPlay from 'app/TangramPlay';
import EditorIO from 'app/addons/ui/EditorIO';

export default class FileDrop {
    constructor () {
        this.el = TangramPlay.container.getElementsByClassName('tp-filedrop-container')[0];

        // Set up drag/drop file listeners
        TangramPlay.container.addEventListener('dragenter', (event) => {
            // Check to make sure that dropped items are files.
            // This prevents other drags (e.g. text in editor)
            // from turning on the file drop area.
            // See here: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
            // Tested in Chrome, Firefox, Safari 8
            var types = event.dataTransfer.types;
            if (types !== null && ((types.indexOf) ? (types.indexOf('Files') !== -1) : types.contains('application/x-moz-file'))) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                this.show();
            }
        }, true);

        this.el.addEventListener('dragover', (event) => {
            // Required to prevent browser from navigating to a file
            // instead of receiving a data transfer
            event.preventDefault();
        }, false);

        this.el.addEventListener('dragleave', (event) => {
            event.preventDefault();
            this.hide();
        }, true);

        this.el.addEventListener('drop', (event) => {
            event.preventDefault();
            this.hide();
            onDropFile(event.dataTransfer.files);
        }, false);
    }

    show () {
        this.el.style.display = 'block';
    }

    hide () {
        this.el.style.display = 'none';
    }
}

function onDropFile (files) {
    if (files.length > 0) {
        const file = files[0];
        EditorIO.open(file);
    }
}
