import LocalStorage from '../storage/localstorage';
import { map } from '../map/map';
import { editor } from '../editor/editor';
import { EventEmitter } from '../components/event-emitter';

// Import Greensock (GSAP)
import 'gsap/src/uncompressed/TweenLite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

const CM_MINIMUM_WIDTH = 160; // integer, in pixels
const MAP_MINIMUM_WIDTH = 130; // integer, in pixels
const STORAGE_POSITION_KEY = 'divider-position-x';

// Cache element references
const dividerEl = document.getElementById('divider');
const mapEl = document.getElementById('map-container');
const contentEl = document.getElementById('content');

let draggable;

export function initDivider () {
    const transformStyle = 'translate3d(' + getStartingPosition() + 'px, 0px, 0px)';

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

    // Override starting position
    dividerEl.style.left = 'auto';
    draggable = Draggable.create(dividerEl, {
        type: 'x',
        bounds: getBounds(),
        cursor: 'col-resize',
        zIndexBoost: false,
        onPress: function () {
            this.target.classList.add('divider-is-dragging');
        },
        onDrag: function () {
            onDividerPositionChange();
            EventEmitter.dispatch('divider:drag');

            // When the divider moves, the editor width changes and might expose blank areas
            // of the document that CodeMirror has not parsed and rendered. This forces the
            // editor to refresh as the divider moves.
            editor.refresh();
        },
        onDragEnd: function () {
            updateMapState();
            saveDividerPosition();
            EventEmitter.dispatch('divider:dragend');
        },
        onRelease: function () {
            this.target.classList.remove('divider-is-dragging');
        }
    });

    window.addEventListener('resize', function () {
        onDividerPositionChange();
        updateMapState();
    });

    onDividerPositionChange();
}

function onDividerPositionChange () {
    const positionX = dividerEl.getBoundingClientRect().left;

    mapEl.style.width = positionX + 'px';
    contentEl.style.width = (window.innerWidth - positionX) + 'px';
}

// We update the map on the end of the drag because
// of horrible flickering of the map in Chrome
function updateMapState () {
    map.invalidateSize({
        pan: {
            animate: false
        },
        zoom: {
            animate: false
        },
        debounceMoveend: true
    });

    draggable[0].applyBounds(getBounds());
}

function saveDividerPosition () {
    const posX = dividerEl.getBoundingClientRect().left;
    if (posX) {
        LocalStorage.setItem(STORAGE_POSITION_KEY, posX);
    }
}

function getStartingPosition () {
    const storedPosition = LocalStorage.getItem(STORAGE_POSITION_KEY);
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

function getBounds () {
    return {
        minX: MAP_MINIMUM_WIDTH,
        maxX: window.innerWidth - CM_MINIMUM_WIDTH
    };
}
