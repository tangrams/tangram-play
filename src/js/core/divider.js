// Import Greensock (GSAP)
import 'gsap/src/uncompressed/Tweenlite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

const CM_MINIMUM_WIDTH = 160; // integer, in pixels
const LOCAL_STORAGE_PREFIX = 'tangram-play-';

let dividerEl;
let TANGRAM_PLAY;

export default class Divider {
    constructor(tangramPlay, dividerId) {
        TANGRAM_PLAY = tangramPlay;

        let transformStyle = 'translate3d(' + getStartingPosition() + 'px, 0px, 0px)';

        dividerEl = document.getElementById(dividerId);

        if (dividerEl.style.hasOwnProperty('transform')) {
            dividerEl.style.transform = transformStyle;
        }
        else if (dividerEl.style.hasOwnProperty('webkitTransform')) {
            // For Safari
            dividerEl.style.webkitTransform = transformStyle;
        }
        else {
            // For Firefox
            dividerEl.style.transform = transformStyle;
        }

        let divider = this;
        this.draggable = Draggable.create(dividerEl, {
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
                savePosition();
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

        // Create Events
        this.onResize = new CustomEvent('resize');
        this.el = dividerEl;
    }

    reflow() {
        let mapEl = document.getElementById('map');
        let contentEl = document.getElementById('content');
        let menuEl = document.querySelector('.tp-menu-container');
        let menuBottom = menuEl.getBoundingClientRect().bottom;
        let positionX = dividerEl.getBoundingClientRect().left;

        mapEl.style.width = positionX + 'px';
        contentEl.style.width = (window.innerWidth - positionX) + 'px';

        TANGRAM_PLAY.editor.setSize('100%', (window.innerHeight - menuBottom) + 'px');
        dividerEl.style.height = (window.innerHeight - menuBottom) + 'px';
    }

    update() {
        TANGRAM_PLAY.map.leaflet.invalidateSize(false);
        this.draggable[0].applyBounds(getBounds());

        // Trigger Events 
        TANGRAM_PLAY.container.dispatchEvent(this.onResize);
    }
}

// Private functions for dragable panel divider

function getStartingPosition() {
    let storedPosition = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'divider-position-x');
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

function savePosition() {
    let posX = dividerEl.getBoundingClientRect().left;
    if (posX) {
        window.localStorage.setItem(LOCAL_STORAGE_PREFIX + 'divider-position-x', posX);
    }
}

function getBounds() {
    return {
        minX: 100,
        maxX: window.innerWidth - CM_MINIMUM_WIDTH
    };
}
