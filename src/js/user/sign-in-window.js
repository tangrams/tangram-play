import { showSignInOverlay, hideSignInOverlay } from '../components/SignInOverlay';
import EventEmitter from '../components/event-emitter';

/**
 * Run Mapzen's sign-in flow in a popup window. Although it's cleaner to iframe
 * into a modal, we tried this but new users are directed to GitHub auth, which
 * cannot be iframed.
 *
 * Due to web security restrictions, sign-in flow can only work if Tangram Play
 * is hosted on the same origin as the Mapzen developer platform, e.g mapzen.com,
 * its staging server, or a local server running the platform in a separate
 * Docker container.
 */
const SIGN_IN_API_ENDPOINT = '/developers/sign_in?popup=true';
const SIGN_IN_HOSTNAME = window.location.hostname === 'localhost' ? 'http://localhost' : '';

let signInWindow;
let pollWindowStateIntervalId;

/**
 * Opens a new window for the sign-in page and places it in the middle of the
 * app window. This was taken from a StackOverflow answer that we've repurposed
 * several times through mapzen.com but still has a problem with some browsers
 * and some multi-monitor setups.
 */
function popupCenter(url, title, w, h) {
  // Fixes dual-screen position                            Most browsers       Firefox
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screen.left;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screen.top;

  /* eslint-disable max-len, no-nested-ternary */
  const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : window.screen.width;
  const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : window.screen.height;
  /* eslint-enable max-len, no-nested-ternary */

  const left = ((width / 2) - (w / 2)) + dualScreenLeft;
  const top = ((height / 3) - (h / 3)) + dualScreenTop;

  return window.open(url, title, `scrollbars=yes, location=no, width=${w}, height=${h}, top=${top}, left=${left}`);
}

/**
 * Closes the sign-in window. This is called when we detect that the user
 * completes the sign-in flow, and if the app window is closed.
 * Closing the sign-in window should automatically clean up after itself
 * due to the `close` event handler.
 */
export function closeSignInWindow() {
  if (signInWindow) {
    signInWindow.close();
  }
}

/**
 * Called when user completes the flow in the sign-in window.
 */
function signInStateReady() {
  EventEmitter.dispatch('mapzen:sign_in', {});
  closeSignInWindow();
  hideSignInOverlay();

  // Returns focus to the original parent window.
  window.focus();
}

/**
 * Cleans up event listeners from the app window to prevent memory leaks.
 */
function cleanup() {
  window.removeEventListener('unload', closeSignInWindow);
  window.clearInterval(pollWindowStateIntervalId);
}

function pollWindowState() {
  if (!signInWindow || signInWindow.closed) {
    window.clearInterval(pollWindowStateIntervalId);
    signInStateReady();
  } else {
    try {
      // If it's exactly /developers, we're probably logged in now
      if (signInWindow.location.pathname === '/developers') {
        signInStateReady();
      }
    } catch (e) {
      // Probably a security policy in the way; ignore
    }
  }
}

/**
 * Primary entry point for opening a sign-in window.
 */
export function openSignInWindow() {
  // Only open if not open already; or was closed from a previous attempt.
  // If it's already open, focus on that instead.
  if (!signInWindow || signInWindow.closed === true) {
    const url = SIGN_IN_HOSTNAME + SIGN_IN_API_ENDPOINT;

    signInWindow = popupCenter(url, 'Sign in to Mapzen Developer Portal', 650, 650);
    signInWindow.addEventListener('close', cleanup);
    window.addEventListener('unload', closeSignInWindow);

    // Show an overlay in the app window.
    showSignInOverlay();

    // We can't add load or close event listeners to the new window (they
    // don't trigger) so instead we poll the window at a set interval
    // and perform actions based on what we can detect inside of it.
    pollWindowStateIntervalId = window.setInterval(pollWindowState, 100);
  }

  // This new window should grab the user's attention immediately
  // Apparently, this doesn't work in all browsers (e.g. Chrome) due to
  // security policies.
  signInWindow.focus();
}
