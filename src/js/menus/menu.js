import TangramPlay, { map } from '../tangram-play';
import { noop } from '../tools/helpers';
import EditorIO from '../editor/io';
import FileOpen from '../file/file-open';
import ExamplesModal from '../modals/modal.examples';
import OpenURLModal from '../modals/modal.open-url';
import AboutModal from '../modals/modal.about';
import SaveGistModal from '../modals/modal.save-gist';
import fullscreen from '../ui/fullscreen';

export default class Menu {
    constructor () {
        this.el = document.body.querySelector('.menu-bar');
        this.menus = {};
        this.initMenuItems();
    }

    initMenuItems () {
        this.menus.new = new MenuItem('.menu-button-new', _onClickNew);
        this.menus.open = new MenuItem('.menu-button-open', _onClickOpen);
        this.menus.save = new MenuItem('.menu-button-save', _onClickSave);
        this.menus.fullscreen = new MenuItem('.menu-button-fullscreen', _onClickFullscreen);
        this.menus.help = new MenuItem('.menu-button-help', _onClickHelp);

        this.fileopen = new FileOpen();
        this.examplesModal = new ExamplesModal(TangramPlay.options.menu);
        this.openUrlModal = new OpenURLModal();
        this.aboutModal = new AboutModal();
        this.saveGistModal = new SaveGistModal();

        // Set up events on dropdown buttons
        // Open menu
        document.body.querySelector('.menu-open-file').addEventListener('click', () => {
            this.fileopen.activate();
        }, false);
        document.body.querySelector('.menu-open-url').addEventListener('click', () => {
            this.openUrlModal.show();
        }, false);
        document.body.querySelector('.menu-open-example').addEventListener('click', () => {
            this.examplesModal.show();
        }, false);

        // Save menu
        document.body.querySelector('.menu-save-file').addEventListener('click', () => {
            EditorIO.export();
        }, false);
        document.body.querySelector('.menu-save-gist').addEventListener('click', () => {
            this.saveGistModal.show();
        }, false);
        document.body.querySelector('.menu-screenshot').addEventListener('click', () => {
            map.takeScreenshot();
        }, false);

        // About
        document.body.querySelector('.menu-about').addEventListener('click', () => {
            this.aboutModal.show();
        }, false);
    }
}

export class MenuItem {
    constructor (classSelector, onClick = noop) {
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
    fullscreen.toggle();
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
