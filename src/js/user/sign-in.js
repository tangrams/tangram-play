/**
 * SignIn to mapzen.com
 *
 */
/*
If not logged in, the response looks like this:

{"logged_in":false}

If logged in, the response looks like this:

{"logged_in":true,"id":7,"email":"name@domain.com","nickname":"name","admin":true}
*/

let cachedSignInData;

/**
 * Request user sign-in information from mapzen.com. This only works with
 * mapzen.com, dev.mapzen.com, or www.mapzen.com. Other mapzen.com domains
 * (e.g. Precog) do not have this `/api/developer.json` endpoint. Also check for
 * https protocol. A no-CORS error is thrown if accessed on http
 *
 * @returns {Promise} - resolved value is contents of `/api/developer.json` or
 *          an object indicating that we are not hosted on a Mapzen domain.
 */
export function requestUserSignInState () {
    if (/^(dev.|www.)?mapzen.com$/.test(window.location.hostname) && window.location.protocol === 'https:') {
        return window.fetch('/api/developer.json', { credentials: 'same-origin' })
            .then((response) => {
                const data = response.json();
                cachedSignInData = data;
                return data;
            })
            .catch((error) => {
                console.log(error);
            });
    }
    else {
        // Returns a promise that resolves to an object with a property
        // indicating that we did not bother fetching developer.json
        return Promise.resolve({ hosted: false });
    }
}

export function getCachedUserSignInData () {
    return cachedSignInData;
}

/**
 * Assumes this is only available when already logged in, so no host check
 * is performed.
 */
export function requestUserSignOut () {
    return window.fetch('/api/developer/sign_out', {
        method: 'POST',
        credentials: 'same-origin'
    });
}
