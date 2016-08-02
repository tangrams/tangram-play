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

let isUserLoggedIn = false;

export function initUserLogin () {
    if (window.location.hostname !== 'mapzen.com' && window.location.hostname !== 'www.mapzen.com') {
        return;
    }

    window.fetch('https://mapzen.com/api/developer.json', { credentials: 'same-origin' })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            window.userLoginData = data;
            if (data.logged_in === true) {
                isUserLoggedIn = true;
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

export function getLoginState () {
    return isUserLoggedIn;
}
