'use strict';

import TangramPlay from '../../TangramPlay.js';
import { noop } from './Helpers.js';
import EditorIO from './EditorIO.js';
import FileOpen from './FileOpen.js';
import ExamplesModal from './Modal.Examples.js';

export default class Menu {
    constructor () {
        this.el = TangramPlay.container.querySelector('.tp-menu-bar');
        this.menus = {};
        this.initMenuItems();
    }

    initMenuItems () {
        this.menus.open = new MenuItem('.tp-menu-button-open', _onClickOpen);
        this.menus.new = new MenuItem('.tp-menu-button-new', _onClickNew);
        this.menus.export = new MenuItem('.tp-menu-button-export', _onClickExport);

        this.fileopen = new FileOpen();
        this.examplesModal = new ExamplesModal(TangramPlay.options.menu);

        TangramPlay.container.querySelector('.tp-menu-open-file').addEventListener('click', () => {
            this.fileopen.activate();
        }, false);
        TangramPlay.container.querySelector('.tp-menu-open-example').addEventListener('click', () => {
            this.examplesModal.show();
        }, false);
    }
}

export class MenuItem {
    constructor (classSelector, onClick = noop) {
        this.el = TangramPlay.container.querySelector(classSelector);
        this.el.addEventListener('click', onClick, false);
    }
}

function _onClickOpen (event) {
    let menuEl = TangramPlay.container.querySelector('.tp-menu-dropdown-open');
    let posX = TangramPlay.container.querySelector('.tp-menu-button-open').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    TangramPlay.container.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickNew (event) {
    EditorIO.new();
}

function _onClickExport (event) {
    EditorIO.export();
}

function _onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('tp-menu-item')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('tp-menu-item')) {
        _loseMenuFocus();
        TangramPlay.container.removeEventListener('click', _onClickOutsideDropdown, false);
    }
}

function _loseMenuFocus () {
    _hideMenus();
}

function _hideMenus () {
    let menus = document.querySelectorAll('.tp-menu-dropdown');
    for (let el of menus) {
        el.style.display = 'none';
    }
    TangramPlay.container.removeEventListener('click', _onClickOutsideDropdown, false);
}
