import { debounce } from '../tools/common';

const loadingEl = document.getElementById('map-loading')

/**
 * Shows the scene loading indicator.
 */
export function showSceneLoadingIndicator () {
    loadingEl.classList.add('map-loading-show');
}

/**
 * Hide the scene loading indicator.
 */
export function hideSceneLoadingIndicator () {
    loadingEl.classList.remove('map-loading-show');
}
