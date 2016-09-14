/* eslint-disable import/prefer-default-export */
// No browsers as of this writing implement Fullscreen API without prefixes
// So we look for prefixed versions of each API feature.
const fullscreenEnabled = document.fullscreenEnabled || // Spec - future
    document.webkitFullscreenEnabled || // (Blink/Webkit) Chrome/Opera/Edge/Safari
    document.mozFullScreenEnabled || // (Gecko) Firefox
    document.msFullscreenEnabled; // IE11

const exitFullscreen = document.exitFullscreen || // Spec
    document.webkitExitFullscreen || // (Blink/Webkit) Chrome/Opera/Edge/Safari
    document.mozCancelFullScreen || // (Gecko) Firefox
    document.msExitFullscreen; // IE11

// Wraps `element.requestFullscreen` in a cross-browser compatible function.
function requestFullscreen(element) {
    if (element.requestFullscreen) { // Spec
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // (Blink/Webkit) Chrome/Opera/Edge/Safari
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.mozRequestFullScreen) { // (Gecko) Firefox
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) { // IE11
        element.msRequestFullscreen();
    }
}

/**
 * Returns the element that is currently being presented in full-screen mode in
 * this document, or null if full-screen mode is not currently in use. Since
 * no browser implements this without a prefix, this function accounts for
 * different cross-browser implementations.
 *
 * In Tangram Play the current fullscreen element is assumed to always be
 * `document.documentElement`, but checking the `fullscreenElement` API returns
 * null if we are not currently in fullscreen mode, so it is useful to check.
 */
export function getFullscreenElement() {
    return document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
}

export function toggleFullscreen() {
    // If fullscreen not enabled, ignore
    if (!fullscreenEnabled) return;

    // Is there a current fullscreen element?
    const fullscreenElement = getFullscreenElement();

    if (!fullscreenElement) {
        requestFullscreen(document.documentElement);
    } else if (exitFullscreen) {
        exitFullscreen();
    }
}
