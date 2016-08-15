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
    if (window.location.hostname.endsWith('mapzen.com')) {
        return window.fetch('/api/developer.json', { credentials: 'same-origin' })
            .then((response) => {
                return response.json();
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
