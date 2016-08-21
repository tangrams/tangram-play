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

export function requestUserSignIn () {
    if (window.location.hostname.endsWith('mapzen.com')) {
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
