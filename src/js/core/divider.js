// Import Greensock (GSAP)
import 'gsap/src/uncompressed/Tweenlite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

const CM_MINIMUM_WIDTH = 160; // integer, in pixels
const LOCAL_STORAGE_PREFIX = 'tangram-play-';

export default class Divider {
    constructor (tangram_play) {

        this.tangram_play = tangram_play;

        var transformStyle = 'translate3d(' + getStartingPosition() + 'px, 0px, 0px)';
        var dividerEl = document.getElementById('divider');
        if (dividerEl.style.hasOwnProperty('transform')) {
            dividerEl.style.transform = transformStyle;
        } else if (dividerEl.style.hasOwnProperty('webkitTransform')) {
            // For Safari
            dividerEl.style.webkitTransform = transformStyle;
        } else {
            // For Firefox
            dividerEl.style.transform = transformStyle;
        }

        let divider = this;
        this.draggable = Draggable.create("#divider", {
            type: "x",
            bounds: getBounds(),
            cursor: 'col-resize',
            onDrag: function () {
                divider.reflow();
            },
            onDragEnd: function () {
                divider.update();
                savePosition();
            }
        });
        
        window.addEventListener('resize', function() {
            divider.reflow();
            divider.update();
        });

        this.reflow();
    };

    reflow () {
        var mapEl = document.getElementById('map');
        var contentEl = document.getElementById('content');
        var dividerEl = document.getElementById('divider');
        var menuEl = document.getElementById('menu-container');
        var menuBottom = menuEl.getBoundingClientRect().bottom;
        var positionX = dividerEl.getBoundingClientRect().left;

        mapEl.style.width = positionX + "px";
        contentEl.style.width = (window.innerWidth - positionX) + "px";

        this.tangram_play.editor.setSize('100%', (window.innerHeight - menuBottom) + 'px');
        dividerEl.style.height = (window.innerHeight - menuBottom) + 'px';
    };

    update () {
        this.tangram_play.map.leaflet.invalidateSize(false);
        this.draggable[0].applyBounds( getBounds() );
    };  
};

// Private functions for dragable panel divider

function getStartingPosition () {
    var storedPosition = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'divider-position-x')
    if (storedPosition) {
        return storedPosition
    }

    if (window.innerWidth > 1024) {
        return Math.floor(window.innerWidth * 0.6)
    } else {
        return Math.floor(window.innerWidth / 2)
    }
};

function savePosition () {
    var posX = document.getElementById('divider').getBoundingClientRect().left
    if (posX) {
        window.localStorage.setItem(LOCAL_STORAGE_PREFIX + 'divider-position-x', posX)
    }
};

function getBounds () {
    return {
        minX: 100,
        maxX: window.innerWidth - CM_MINIMUM_WIDTH
    }
};