/* global Modernizr */
// Mozilla (Firefox) has its own language for fullscreen API
const requestFullscreen = Modernizr.prefixed('requestFullscreen', document.documentElement) ||
                          Modernizr.prefixed('requestFullScreen', document.documentElement);
const exitFullscreen = Modernizr.prefixed('exitFullscreen', document) ||
                       Modernizr.prefixed('cancelFullScreen', document);

export function toggleFullscreen () {
    // Is there a current fullscreen element?
    let fullscreenElement = Modernizr.prefixed('fullscreenElement', document) || Modernizr.prefixed('fullScreenElement', document);
    if (!fullscreenElement) {
        // Special case for webkit
        if (document.documentElement.webkitRequestFullscreen) {
            requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        // All other browsers
        else if (requestFullscreen) {
            requestFullscreen();
        }
    }
    else {
        if (exitFullscreen) {
            exitFullscreen();
        }
    }
}
