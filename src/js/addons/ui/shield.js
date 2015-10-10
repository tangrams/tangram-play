'use strict';

import { container } from 'app/TangramPlay';

export default class Shield {
    constructor () {
        this.el = container.getElementsByClassName('tp-shield')[0];
    }

    show () {
        this.el.style.display = 'block';
    }

    hide () {
        this.el.style.display = 'none';
    }
}
