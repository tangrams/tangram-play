'use strict';

import TangramPlay from 'app/TangramPlay';
import { map, editor } from 'app/TangramPlay';
import LocalStorage from 'app/addons/LocalStorage';

// Import Greensock (GSAP)
import 'gsap/src/uncompressed/Tweenlite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

const CM_MINIMUM_WIDTH = 160; // integer, in pixels
const MAP_MINIMUM_WIDTH = 130; // integer, in pixels
const STORAGE_POSITION_KEY = 'divider-position-x';

export default class Divider {
    constructor() {
        let transformStyle = 'translate3d(' + getStartingPosition() + 'px, 0px, 0px)';

        this.el = document.getElementById('divider');

        if (this.el.style.hasOwnProperty('transform')) {
            this.el.style.transform = transformStyle;
        }
        else if (this.el.style.hasOwnProperty('webkitTransform')) {
            // For Safari
            this.el.style.webkitTransform = transformStyle;
        }
        else {
            // For Firefox
            this.el.style.transform = transformStyle;
        }

        let divider = this;
        this.draggable = Draggable.create(this.el, {
            type: 'x',
            bounds: getBounds(),
            cursor: 'col-resize',
            zIndexBoost: false,
            onPress: function () {
                this.target.classList.add('tp-divider-is-dragging');
            },
            onDrag: function () {
                divider.reflow();
            },
            onDragEnd: function () {
                divider.update();
                divider.savePosition();
            },
            onRelease: function () {
                this.target.classList.remove('tp-divider-is-dragging');
            }
        });

        window.addEventListener('resize', function() {
            divider.reflow();
            divider.update();
        });

        this.reflow();
    }

    reflow() {
        let mapEl = document.getElementById('map-container');
        let contentEl = document.getElementById('content');
        let menuEl = document.querySelector('.tp-menu-container');
        let menuBottom = menuEl.getBoundingClientRect().bottom;
        let positionX = this.el.getBoundingClientRect().left;

        mapEl.style.width = positionX + 'px';
        contentEl.style.width = (window.innerWidth - positionX) + 'px';

        editor.setSize('100%', (window.innerHeight - menuBottom) + 'px');
        this.el.style.height = (window.innerHeight - menuBottom) + 'px';

        // Triggers resize event to reposition editor widgets
        // Sends positioning data to subscribers
        TangramPlay.trigger('resize', {
            mapX: positionX,
            contentX: window.innerWidth - positionX
        });
    }

    update() {
        // We update the map on the end of the drag because
        // of horrible flickering of the map in Chrome
        map.leaflet.invalidateSize({
            pan: {
                animate: false
            },
            zoom: {
                animate: false
            },
            debounceMoveend: true
        });
        this.draggable[0].applyBounds(getBounds());
    }

    savePosition() {
        let posX = this.el.getBoundingClientRect().left;
        if (posX) {
            LocalStorage.setItem(STORAGE_POSITION_KEY, posX);
        }
    }
}

// Private functions for dragable panel divider

function getStartingPosition() {
    let storedPosition = LocalStorage.getItem(STORAGE_POSITION_KEY);
    if (storedPosition) {
        return storedPosition;
    }

    if (window.innerWidth > 1024) {
        return Math.floor(window.innerWidth * 0.6);
    }
    else {
        return Math.floor(window.innerWidth / 2);
    }
}

function getBounds() {
    return {
        minX: MAP_MINIMUM_WIDTH,
        maxX: window.innerWidth - CM_MINIMUM_WIDTH
    };
}
