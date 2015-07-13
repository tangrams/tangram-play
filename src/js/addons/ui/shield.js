'use strict';

export default class Shield {
    constructor (container = document) {
        this.el = container.getElementsByClassName('tp-shield')[0];
    }

    show () {
        this.el.style.display = 'block';
    }

    hide () {
        this.el.style.display = 'none';
    }
}
