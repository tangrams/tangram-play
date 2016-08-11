import { EventEmitter } from '../components/event-emitter';

/**
 * This modal loads mapzen.com's login flow into an iframe, so it outsources
 * as much of it as possible out of Tangram Play. When the iframe source looks
 * like the user has successfully signed in / signed up, we toggle the state
 * on the login window and the user log in state in the application.
 * Due to web security restrictions, this must be tested on mapzen.com and
 * should not be loaded in other contexts (e.g. localhost)
 */

let loginWindow;
let pollWindowStateIntervalId;
let redirectingTimerId;

/**
 * Primary entry point for opening a login window.
 */
export function openLoginWindow () {
    // Only open if not open already; or was closed from a previous attempt.
    // If it's already open, focus on that instead.
    if (!loginWindow || loginWindow.closed === true) {
        loginWindow = popupCenter('/developers/sign_in', 'Login to Mapzen Developer Portal', 650, 650);
        loginWindow.addEventListener('close', cleanup);
        window.addEventListener('unload', closeLoginWindow);

        // Experimental.
        loginWindow.document.body.style.opacity = 0;
        loginWindow.addEventListener('load', adjustLoginPageContent);

        // We can't add load or close event listeners to the new window (they
        // don't trigger) so instead we poll the window at a set interval
        // and perform actions based on what we can detect inside of it.
        pollWindowStateIntervalId = window.setInterval(pollWindowState, 100);
    }

    // This new window should grab the user's attention immediately
    // Apparently, this doesn't work in all browsers (e.g. Chrome) due to
    // security policies.
    loginWindow.focus();
}

function pollWindowState () {
    if (!loginWindow || loginWindow.closed) {
        window.clearInterval(pollWindowStateIntervalId);
        loginStateReady();
    }
    else {
        try {
            // If it's exactly /developers, we're probably logged in now
            if (loginWindow.location.pathname === '/developers') {
                adjustDonePageContent();
                if (!redirectingTimerId) {
                    redirectingTimerId = window.setTimeout(loginStateReady, 2000);
                }
            }
            // Experimental: hack the view for developer pages.
            if (loginWindow.location.pathname.indexOf('/developers/') === 0) {
                adjustLoginPageContent();
            }
        }
        catch (e) {
            // Probably a security policy in the way; ignore
        }
    }
}

/**
 * Called when user completes the flow in the login window.
 */
function loginStateReady () {
    EventEmitter.dispatch('mapzen:sign_in', {});
    closeLoginWindow();

    // Returns focus to the original parent window.
    window.focus();
}

/**
 * Closes the login window. This is called when we detect that the user
 * completes the login flow, and if the app window is closed.
 * Closing the login window should automatically clean up after itself
 * due to the `close` event handler.
 */
function closeLoginWindow () {
    if (loginWindow) {
        loginWindow.close();
    }
}

/**
 * Cleans up event listeners from the app window to prevent memory leaks.
 */
function cleanup () {
    window.removeEventListener('unload', closeLoginWindow);
    window.clearInterval(pollWindowStateIntervalId);
    window.clearTimeout(redirectingTimerId);
}

/**
 * A super hacky experiment to restyle Mapzen's stock login page just the way
 * we like it. There's no guarantee this works forever especially as DOM
 * elements, class selectors and styles may evolve over time.
 */
function adjustLoginPageContent () {
    const childDocument = loginWindow.document;

    // Only do this once
    if (childDocument.querySelector('#dev_login') && !childDocument.getElementById('tangram-play-login-override-styles')) {
        const newStyleEl = document.createElement('style');
        const newStyleText = `
            body {
                margin-top: 0;
                overflow: hidden;
            }
            h3 {
                line-height: 1.4em;
                margin-bottom: 20px;
            }
            body.hide-fixed-main-nav nav.navbar-fixed-top {
                top: 0;
            }
            nav.navbar.navbar-default.navbar-fixed-top {
                position: absolute;
            }
            .navbar-collapse.navbar-collapse.navbar-collapse {
                display: none !important;
            }
            a.navbar-brand {
                left: 50%;
                position: absolute;
                margin-left: -80px !important;
                pointer-events: none;
                user-select: none;
                touch-action: none;
            }
            .headroom-extra-large {
                margin-top: 20px;
            }
            footer {
                display: none;
            }
            #dev_login.container {
                position: absolute;
                bottom: 0;
                top: 60px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                left: 0;
                width: 100%;
                max-width: 100%;
                padding-left: 3em;
                padding-right: 3em;
            }
            @media (max-height: 500px) {
                #dev_login.container {
                    top: 50px;
                    transform: scale(.80);
                    padding-left: 1em;
                    padding-right: 1em;
                }
            }
            button.navbar-toggle {
                display: none;
            }
        `;
        newStyleEl.id = 'tangram-play-login-override-styles';
        newStyleEl.textContent = newStyleText;

        childDocument.head.appendChild(newStyleEl);
        childDocument.querySelector('#dev_login h1').textContent = 'Sign in to Mapzen';
        childDocument.querySelector('#dev_login h3').textContent = 'You can save Tangram scenes to your Mapzen account and do other stuff good too';
    }
}

function adjustDonePageContent () {
    const childDocument = loginWindow.document;

    // Only do this once
    if (!childDocument.getElementById('tangram-play-login-override-styles')) {
        const newStyleEl = document.createElement('style');
        const newStyleText = `
            body {
                margin-top: 0;
                overflow: hidden;
            }
            body.hide-fixed-main-nav nav.navbar-fixed-top {
                top: 0;
            }
            nav.navbar.navbar-default.navbar-fixed-top {
                position: absolute;
            }
            .navbar-collapse.navbar-collapse.navbar-collapse {
                display: none !important;
            }
            a.navbar-brand {
                left: 50%;
                position: absolute;
                margin-left: -80px !important;
                pointer-events: none;
                user-select: none;
                touch-action: none;
            }
            button.navbar-toggle {
                display: none;
            }
            #tangram-play-override-redirecting {
                position: fixed;
                top: 0px;
                left: 0px;
                width: 100%;
                height: 100%;
                background-color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
        `;
        newStyleEl.id = 'tangram-play-login-override-styles';
        newStyleEl.textContent = newStyleText;

        childDocument.head.appendChild(newStyleEl);

        const redirectEl = document.createElement('div');
        redirectEl.id = 'tangram-play-override-redirecting';

        const loadingSpinnerEl = document.createElement('div');
        loadingSpinnerEl.className = 'loading-spinner-02';

        const textEl = document.createTextNode('p');
        textEl.textContent = 'Signed in! Redirecting...';

        redirectEl.appendChild(loadingSpinnerEl);
        redirectEl.appendChild(textEl);
        childDocument.body.appendChild(redirectEl);
    }
}

/**
 * Opens a new window for the login page and places it in the middle of the
 * app window. This was taken from a StackOverflow answer that we've repurposed
 * several times through mapzen.com but still has a problem with some browsers
 * and some multi-monitor setups.
 */
function popupCenter (url, title, w, h) {
    // Fixes dual-screen position                            Most browsers       Firefox
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screen.left;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screen.top;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : window.screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : window.screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 3) - (h / 3)) + dualScreenTop;

    return window.open(url, title, 'scrollbars=yes, location=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}
