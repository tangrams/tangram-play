'use strict';

import { container } from 'app/TangramPlay';
import Modal from 'app/addons/ui/Modal';
import CodeMirror from 'codemirror';

let modalEl;

export default class SaveGistModal extends Modal {
    constructor () {
        super();
        this.el = modalEl = container.querySelector('.tp-save-gist-modal');
    }
}
