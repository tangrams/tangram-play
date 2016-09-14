// No browsers as of this writing implement Fullscreen API without prefixes
// So we look for prefixed versions of each API feature.
const fullscreenEnabled = document.fullscreenEnabled || // Spec - future
    document.webkitFullscreenEnabled || // (Blink/Webkit) Chrome/Opera/Edge/Safari
    document.mozFullScreenEnabled || // (Gecko) Firefox
    document.msFullscreenEnabled; // IE11

function exitFullscreen() {
    // This cannot be reassigned to a common function or errors may appear, so each
    // vendor-prefixed API is checked individually and run if present.
    if (document.exitFullscreen) { // Spec
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // (Blink/Webkit) Chrome/Opera/Edge/Safari
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) { // (Gecko) Firefox
        // Mozilla has its own syntax for this.
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
    }
}

// Wraps `element.requestFullscreen` in a cross-browser compatible function.
function requestFullscreen(element) {
    if (element.requestFullscreen) { // Spec
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // (Blink/Webkit) Chrome/Opera/Edge/Safari
        // Webkit-based browsers disables keyboard input in fullscreen for
        // some reason (security?) but it can be requested. However Safari
        // will refuse to allow keyboard input no matter what.
        element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
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
 * @returns {Node|null} - a DOM element that is currently displayed in
 *          full screen (usually equal to `document.documentElement`), or `null`
 *          if no element is displayed in full screen.
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

function logFullscreenError(error) {
    console.log(error);
}

document.addEventListener('fullscreenerror', logFullscreenError, false);
document.addEventListener('mozfullscreenerror', logFullscreenError, false);
document.addEventListener('webkitfullscreenerror', logFullscreenError, false);
document.addEventListener('MSFullscreenError', logFullscreenError, false);
