import _ from 'lodash';
import EditorIO from '../editor/io';
import { openLocalFile } from '../file/open-local';
import { examplesModal } from '../modals/modal.examples';
import { openURLModal } from '../modals/modal.open-url';
import { openGistModal } from '../modals/modal.open-gist';
import { saveGistModal } from '../modals/modal.save-gist';
import { aboutModal } from '../modals/modal.about';
import { toggleFullscreen } from '../ui/fullscreen';
import { takeScreenshot } from '../map/map';

const menus = {};

function initMenuItems () {
    menus.new = new MenuItem('.menu-button-new', _onClickNew);
    menus.open = new MenuItem('.menu-button-open', _onClickOpen);
    menus.save = new MenuItem('.menu-button-save', _onClickSave);
    menus.fullscreen = new MenuItem('.menu-button-fullscreen', _onClickFullscreen);
    menus.help = new MenuItem('.menu-button-help', _onClickHelp);

    // Set up events on dropdown buttons
    // Open menu
    document.body.querySelector('.menu-open-file').addEventListener('click', () => {
        openLocalFile();
    }, false);
    document.body.querySelector('.menu-open-gist').addEventListener('click', () => {
        openGistModal.show();
    }, false);
    document.body.querySelector('.menu-open-url').addEventListener('click', () => {
        openURLModal.show();
    }, false);
    document.body.querySelector('.menu-open-example').addEventListener('click', () => {
        examplesModal.show();
    }, false);

    // Save menu
    document.body.querySelector('.menu-save-file').addEventListener('click', () => {
        EditorIO.export();
    }, false);
    document.body.querySelector('.menu-save-gist').addEventListener('click', () => {
        saveGistModal.show();
    }, false);
    document.body.querySelector('.menu-screenshot').addEventListener('click', () => {
        takeScreenshot();
    }, false);

    // About
    document.body.querySelector('.menu-about').addEventListener('click', () => {
        aboutModal.show();
    }, false);
}

export class MenuItem {
    constructor (classSelector, onClick = _.noop) {
        this.el = document.body.querySelector(classSelector);

        // Attach listeners, including those for tooltip behavior
        this.el.addEventListener('click', (event) => {
            this.el.setAttribute('data-tooltip-state', 'disabled');

            // Hide currently open menus, if any
            _loseMenuFocus();

            // Execute onClick callback
            onClick(event);
        }, true);
    }
}

initMenuItems();

// Dropdown menus

function _onClickOpen (event) {
    let menuEl = document.body.querySelector('.menu-dropdown-open');
    let posX = document.body.querySelector('.menu-button-open').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    window.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickSave (event) {
    let menuEl = document.body.querySelector('.menu-dropdown-save');
    let posX = document.body.querySelector('.menu-button-save').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    window.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickHelp (event) {
    let menuEl = document.body.querySelector('.menu-dropdown-help');
    menuEl.style.right = '0px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    window.addEventListener('click', _onClickOutsideDropdown, false);
}

// Single action buttons

function _onClickNew (event) {
    EditorIO.new();
    _resetTooltipState();
}

function _onClickFullscreen (event) {
    toggleFullscreen();
}

// Resetting state

function _onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('menu-item')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('menu-item')) {
        _loseMenuFocus();
        document.body.removeEventListener('click', _onClickOutsideDropdown, false);
    }
}

function _loseMenuFocus () {
    _hideMenus();
    _resetTooltipState();
}

function _hideMenus () {
    let menus = document.querySelectorAll('.menu-dropdown');
    for (let el of menus) {
        el.style.display = 'none';
    }
    document.body.removeEventListener('click', _onClickOutsideDropdown, false);
}

function _resetTooltipState () {
    let items = document.querySelectorAll('.menu-item');
    for (let el of items) {
        el.removeAttribute('data-tooltip-state');
    }
}
