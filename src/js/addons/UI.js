'use strict';

import EditorIO from './ui/EditorIO.js';
import Shield from './ui/Shield.js';
import Modal from './ui/Modal.js';
import FileDrop from './ui/FileDrop.js';
import FileOpen from './ui/FileOpen.js';
import ExamplesModal from './ui/Modal.Examples.js';

export default class UI {
    constructor (tangram_play) {
        const container = tangram_play.container;
        const options = tangram_play.options;

        // Set up UI components
        new Shield();
        new FileDrop(container);
        this.fileopen = new FileOpen(container);
        this.examplesModal = new ExamplesModal(options.menu);

        document.getElementById('menu-button-open').addEventListener('click', function (e) {
            let menuEl = document.getElementById('menu-open')
            let posX = document.getElementById('menu-button-open').getBoundingClientRect().left
            menuEl.style.left = posX + 'px'
            menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block'
            document.body.addEventListener('click', onClickOutsideDropdown, false)
        }, false)

        document.getElementById('menu-button-new').addEventListener('click', () => { EditorIO.new() }, false)
        document.getElementById('menu-button-export').addEventListener('click', EditorIO.export, false);

        document.getElementById('menu-open-file').addEventListener('click', () => { this.fileopen.activate() }, false)
        document.getElementById('menu-open-example').addEventListener('click', () => { this.examplesModal.show() }, false)

        document.body.addEventListener('keyup', function (e) {
            // esc key
            if (e.keyCode === 27) {
                // TODO. Implement after UI elements handle / remember state better
            }
        })

        window.onpopstate = function (e) {
            if (e.state && e.state.loadStyleURL) {
                tangram_play.loadQuery();
            }
        }
    };
};

function hideMenus () {
    let els = document.querySelectorAll('.menu-dropdown');
    for (let i = 0, j = els.length; i < j; i++) {
        els[i].style.display = 'none';
    }
    document.body.removeEventListener('click', onClickOutsideDropdown, false);
}

function loseMenuFocus () {
    hideMenus();
}

function onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('menu-item')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('menu-item')) {
        loseMenuFocus();
        document.body.removeEventListener('click', onClickOutsideDropdown, false);
    }
}
