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

const pause = {
    toggle: function () {
        if (TangramPlay.paused === false) {
            // Record the state on the app. TangramPlay.updateContent() will
            // do nothing if the paused property is set to true.
            TangramPlay.paused = true;

            // Turn off animation in Tangram
            map.scene.animated = false;

            // Change the button's state
            labelEl.textContent = 'Play';
            iconEl.className = 'btb bt-play';
            pauseButtonEl.setAttribute('data-tooltip', 'Turn on map updates');
        }
        else {
            // Record the state on the app
            TangramPlay.paused = false;

            // Immediately send current editor contents to get the map going
            // Updating content turns scene.animated to true automatically
            TangramPlay.updateContent();

            // Change the button's state
            labelEl.textContent = 'Pause';
            iconEl.className = 'btb bt-pause';
            pauseButtonEl.setAttribute('data-tooltip', 'Pause map updates');
        }
    }
};

export default pause;
