import TangramPlay, { container, map } from '../../TangramPlay';
import { noop } from './Helpers';
import EditorIO from './EditorIO';
import FileOpen from './FileOpen';
import ExamplesModal from './Modal.Examples';
import OpenURLModal from './Modal.OpenURL';
import AboutModal from './Modal.About';
import SaveGistModal from './Modal.SaveToGist';
import fullscreen from './fullscreen';

export default class Menu {
    constructor () {
        this.el = container.querySelector('.menu-bar');
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
        container.querySelector('.menu-open-file').addEventListener('click', () => {
            this.fileopen.activate();
        }, false);
        container.querySelector('.menu-open-url').addEventListener('click', () => {
            this.openUrlModal.show();
        }, false);
        container.querySelector('.menu-open-example').addEventListener('click', () => {
            this.examplesModal.show();
        }, false);

        // Save menu
        container.querySelector('.menu-save-file').addEventListener('click', () => {
            EditorIO.export();
        }, false);
        container.querySelector('.menu-save-gist').addEventListener('click', () => {
            this.saveGistModal.show();
        }, false);
        container.querySelector('.menu-screenshot').addEventListener('click', () => {
            map.takeScreenshot();
        }, false);

        // About
        container.querySelector('.menu-about').addEventListener('click', () => {
            this.aboutModal.show();
        }, false);
    }
}

export class MenuItem {
    constructor (classSelector, onClick = noop) {
        this.el = container.querySelector(classSelector);

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
    let menuEl = container.querySelector('.menu-dropdown-open');
    let posX = container.querySelector('.menu-button-open').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    container.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickSave (event) {
    let menuEl = container.querySelector('.menu-dropdown-save');
    let posX = container.querySelector('.menu-button-save').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    container.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickHelp (event) {
    let menuEl = container.querySelector('.menu-dropdown-help');
    menuEl.style.right = '0px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    container.addEventListener('click', _onClickOutsideDropdown, false);
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
        container.removeEventListener('click', _onClickOutsideDropdown, false);
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
    container.removeEventListener('click', _onClickOutsideDropdown, false);
}

function _resetTooltipState () {
    let items = document.querySelectorAll('.menu-item');
    for (let el of items) {
        el.removeAttribute('data-tooltip-state');
    }
}
