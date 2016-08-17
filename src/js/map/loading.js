/**
 * Shows the scene loading indicator.
 */
export function showSceneLoadingIndicator () {
    document.getElementById('map-loading').classList.add('map-loading-show');
}

/**
 * Hide the scene loading indicator.
 */
export function hideSceneLoadingIndicator () {
    document.getElementById('map-loading').classList.remove('map-loading-show');
}
