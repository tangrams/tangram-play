/**
 * Pause tells Tangram not to update with every change in the editor, and
 * it also turns off animation while it is on. It does not prevent you from
 * changing the view on the map (like panning, zooming, etc). Unpausing will
 * immediately update Tangram with the latest content of the editor, which
 * also reactivates the animation.
 */

import TangramPlay, { map } from 'app/TangramPlay';

// Cache references to all elements
const pauseButtonEl = document.querySelector('.menu-button-pause');
const labelEl = pauseButtonEl.querySelector('.tp-menu-item-label');
const iconEl = pauseButtonEl.querySelector('i');

/**
 * This toggles pause state in the application. It is the only export.
 */
export function togglePause () {
    if (TangramPlay.paused === true) {
        unpauseUpdates();
        showPauseButton();
    }
    else {
        pauseUpdates();
        showPlayButton();
    }
}

/**
 * Records pause state as true on TangramPlay app object.
 * TangramPlay.updateContent() will do nothing as a result.
 * Also, turn off animation in Tangram.
 */
function pauseUpdates () {
    TangramPlay.paused = true;
    map.scene.animated = false;
}

/**
 * Records pause state as false on TangramPlay app object.
 * Then immediately call updateContent() to send the editor's
 * current contents to update the map, which also turns animation
 * back on automatically.
 */
function unpauseUpdates () {
    TangramPlay.paused = false;
    TangramPlay.updateContent();
}

/**
 * Changes the button to read 'Pause'
 */
function showPauseButton () {
    labelEl.textContent = 'Pause';
    iconEl.className = 'btb bt-pause';
    pauseButtonEl.setAttribute('data-tooltip', 'Pause map updates');
}

/**
 * Changes the button to read 'Play'
 */
function showPlayButton () {
    labelEl.textContent = 'Play';
    iconEl.className = 'btb bt-play';
    pauseButtonEl.setAttribute('data-tooltip', 'Turn on map updates');
}
