/**
 * SignIn to mapzen.com
 *
 */
let cachedSignInData;

/**
 * Request user sign-in information from mapzen.com. This only works with
 * mapzen.com, dev.mapzen.com, or www.mapzen.com. Other mapzen.com domains
 * (e.g. Precog) do not have this `/api/developer.json` endpoint. Also check for
 * https protocol. A no-CORS error is thrown if accessed on http
 *
 * If logged in, the response looks like this:
 *
 * {"logged_in":true,"id":7,"email":"name@domain.com","nickname":"name","admin":true}
 *
 * If not logged in, the response is an empty object, like this:
 *
 * {}
 *
 * @returns {Promise} - resolved value is contents of `/api/developer.json`
 *          or `null` if Tangrma Play is not hosted on a domain where this
 *          API is available.
 * @todo Handle errors related to fetching API.
 */
export function requestUserSignInState() {
    if (/^(dev.|www.)?mapzen.com$/.test(window.location.hostname) &&
        window.location.protocol === 'https:') {
        return window.fetch('/api/developer.json', { credentials: 'same-origin' })
            .then((response) => {
                const data = response.json();
                cachedSignInData = data;
                return data;
            });
    }

    // Returns a promise that resolves to `null` if Tangram Play is not
    // hosted somewhere where the `/api/developer.json` endpoint is
    // available.
    return Promise.resolve(null);
}

export function getCachedUserSignInData() {
    return cachedSignInData;
}

/**
 * Assumes this is only available when already logged in, so no host check
 * is performed.
 */
export function requestUserSignOut() {
    return window.fetch('/api/developer/sign_out', {
        method: 'POST',
        credentials: 'same-origin',
    });
}
