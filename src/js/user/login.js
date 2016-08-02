/**
 * Login to mapzen.com
 *
 */
/*
If not logged in, the response looks like this:

{"logged_in":false}

If logged in, the response looks like this:

{"logged_in":true,"id":7,"email":"name@domain.com","nickname":"name","admin":true}
*/

export function getUserLogin () {
    // Only login if over HTTPS
    if (!window.location.hostname.endsWith('mapzen.com')) {
        // Returns a promise that resolves to an empty object if this does not run
        return Promise.resolve({});
    }
    else {
        return window.fetch('/api/developer.json', { credentials: 'same-origin' })
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                console.log(error);
            });
    }
}
