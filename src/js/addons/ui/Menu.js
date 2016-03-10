import TangramPlay, { container, map } from 'app/TangramPlay';
import { noop } from 'app/addons/ui/Helpers';
import EditorIO from 'app/addons/ui/EditorIO';
import FileOpen from 'app/addons/ui/FileOpen';
import ExamplesModal from 'app/addons/ui/Modal.Examples';
import OpenURLModal from 'app/addons/ui/Modal.OpenURL';
import AboutModal from 'app/addons/ui/Modal.About';
import SaveGistModal from 'app/addons/ui/Modal.SaveToGist';
import fullscreen from 'app/addons/ui/fullscreen';
import { togglePause } from 'app/addons/ui/pause';

export default class Menu {
    constructor () {
        this.el = container.querySelector('.tp-menu-bar');
        this.menus = {};
        this.initMenuItems();
    }

    initMenuItems () {
        this.menus.new = new MenuItem('.tp-menu-button-new', _onClickNew);
        this.menus.open = new MenuItem('.tp-menu-button-open', _onClickOpen);
        this.menus.save = new MenuItem('.tp-menu-button-save', _onClickSave);
        this.menus.pause = new MenuItem('.menu-button-pause', _onClickPause);
        this.menus.fullscreen = new MenuItem('.tp-menu-button-fullscreen', _onClickFullscreen);
        this.menus.help = new MenuItem('.tp-menu-button-help', _onClickHelp);

        this.fileopen = new FileOpen();
        this.examplesModal = new ExamplesModal(TangramPlay.options.menu);
        this.openUrlModal = new OpenURLModal();
        this.aboutModal = new AboutModal();
        this.saveGistModal = new SaveGistModal();

        // Set up events on dropdown buttons
        // Open menu
        container.querySelector('.tp-menu-open-file').addEventListener('click', () => {
            this.fileopen.activate();
        }, false);
        container.querySelector('.tp-menu-open-url').addEventListener('click', () => {
            this.openUrlModal.show();
        }, false);
        container.querySelector('.tp-menu-open-example').addEventListener('click', () => {
            this.examplesModal.show();
        }, false);

        // Save menu
        container.querySelector('.tp-menu-save-file').addEventListener('click', () => {
            EditorIO.export();
        }, false);
        container.querySelector('.tp-menu-save-gist').addEventListener('click', () => {
            this.saveGistModal.show();
        }, false);
        container.querySelector('.tp-menu-screenshot').addEventListener('click', () => {
            map.takeScreenshot();
        }, false);

        // About
        container.querySelector('.tp-menu-about').addEventListener('click', () => {
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
    let menuEl = container.querySelector('.tp-menu-dropdown-open');
    let posX = container.querySelector('.tp-menu-button-open').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    container.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickSave (event) {
    let menuEl = container.querySelector('.tp-menu-dropdown-save');
    let posX = container.querySelector('.tp-menu-button-save').getBoundingClientRect().left;
    menuEl.style.left = posX + 'px';
    menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
    if (menuEl.style.display === 'none') {
        _resetTooltipState();
    }
    container.addEventListener('click', _onClickOutsideDropdown, false);
}

function _onClickHelp (event) {
    let menuEl = container.querySelector('.tp-menu-dropdown-help');
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

function _onClickPause (event) {
    togglePause();
}

// Resetting state

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
    _resetTooltipState();
}

function _hideMenus () {
    let menus = document.querySelectorAll('.tp-menu-dropdown');
    for (let el of menus) {
        el.style.display = 'none';
    }
    container.removeEventListener('click', _onClickOutsideDropdown, false);
}

function _resetTooltipState () {
    let items = document.querySelectorAll('.tp-menu-item');
    for (let el of items) {
        el.removeAttribute('data-tooltip-state');
    }
}
