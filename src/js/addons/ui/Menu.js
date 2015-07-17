'use strict';
// For now: assume globals
/* global tangramPlay */

import { noop } from './Helpers.js';
import EditorIO from './EditorIO.js';
import FileOpen from './FileOpen.js';
import ExamplesModal from './Modal.Examples.js';

let container;

export default class Menu {
    constructor (options) {
        // Not great. TODO: Figure out how to get access to the
        // tangramPlay instance without having to pass it in
        // as an argument.
        container = (typeof tangramPlay !== 'undefined') ? tangramPlay.container : document;

        this.el = container.querySelector('.tp-menu-bar');
        this.menus = {};
        this.initMenuItems(options);
    }

    initMenuItems (options) {
        this.menus.open = new MenuItem('.tp-menu-button-open', _onClickOpen);
        this.menus.new = new MenuItem('.tp-menu-button-new', _onClickNew);
        this.menus.export = new MenuItem('.tp-menu-button-export', _onClickExport);

        this.fileopen = new FileOpen();
        this.examplesModal = new ExamplesModal(options.menu);

        container.querySelector('.tp-menu-open-file').addEventListener('click', () => {
            this.fileopen.activate();
        }, false);
        container.querySelector('.tp-menu-open-example').addEventListener('click', () => {
            this.examplesModal.show();
        }, false);
    }
}

export class MenuItem {
    constructor (classSelector, onClick = noop) {
        this.el = container.querySelector(classSelector);
        this.el.addEventListener('click', onClick, false);
    }
}

function _onClickOpen (event) {
    let menuEl = container.querySelector('.tp-menu-dropdown-open');
    let posX = container.querySelector('.tp-menu-button-open').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    container.addEventListener('click', _onClickOutsideDropdown, false);
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
        container.removeEventListener('click', _onClickOutsideDropdown, false);
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
    container.removeEventListener('click', _onClickOutsideDropdown, false);
}
