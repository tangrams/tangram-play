/**
 * SignIn to mapzen.com
 */
import store from '../store';
import config from '../config';
import { USER_SIGNED_IN, USER_SIGNED_OUT } from '../store/actions';
import { getURLSearchParam } from '../tools/url-state';

const SIGN_IN_STATE_API_ENDPOINT = '/api/developer.json';
const SIGN_OUT_API_ENDPOINT = '/api/developer/sign_out';

// Sign-in is enabled if the host matches https://mapzen.com/ or https://dev.mapzen.com/
// Or if it is a localhost server (for local testing) and the query string ?forceSignIn=true
// It is disabled on http and any other host.
const isMapzenHosted = /^(dev.|www.)?mapzen.com$/.test(window.location.hostname);
const signInEnabled = (isMapzenHosted && window.location.protocol === 'https:') ||
  (getURLSearchParam('forceSignIn') === 'true' && window.location.hostname === 'localhost');

// Set credentials option for window.fetch depending on host.
// Cookies are sent for each request only if the origin matches on mapzen.com,
// but are always included for local environments (this allows back-ends to
// run on different ports than Tangram Play.
const signInCredentials = window.location.hostname === 'localhost' ? 'include' : 'same-origin';
const signInHost = window.location.hostname === 'localhost' ? config.MAPZEN_API.ORIGIN.DEVELOPMENT : '';

let cachedSignInData;

/**
 * Request user sign-in information from mapzen.com. This only works with
 * mapzen.com, dev.mapzen.com, or www.mapzen.com. Other mapzen.com domains
 * (e.g. Precog) do not have this `/api/developer.json` endpoint. Also check for
 * https protocol. A no-CORS error is thrown if accessed on http
 *
 * If logged in, the response looks like this:
 *
 * {"logged_in":true,"id":7,"email":"name@domain.com","nickname":"name","admin":null}
 *
 * If not logged in, the response is an empty object, like this:
 *
 * {}
 *
 * If the user is an admin, the "admin" field is boolean `true`. Note that
 * non-admins are `null` not `false`.
 *
 * @returns {Promise} - resolved value is contents of `/api/developer.json`
 *          or `null` if Tangrma Play is not hosted on a domain where this
 *          API is available.
 * @todo Handle errors related to fetching API.
 */
export function requestUserSignInState() {
  if (signInEnabled) {
    return window.fetch(signInHost + SIGN_IN_STATE_API_ENDPOINT, { credentials: signInCredentials })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status);
        }

        return response.json();
      })
      .then((data) => {
        cachedSignInData = data;

        store.dispatch({
          type: USER_SIGNED_IN,
          id: data.id,
          nickname: data.nickname,
          email: data.email,
          avatar: data.avatar,
          admin: data.admin,
        });

        return data;
      });
  } else if (isMapzenHosted && window.location.protocol === 'http') {
    return Promise.resolve({
      authDisabled: true,
    });
  }

  // Returns a promise that resolves to `null` if Tangram Play is not
  // hosted somewhere where the `/api/developer.json` endpoint is
  // available.
  return Promise.resolve(null);
}

// Note: deprecated (only used for Gist)
export function getCachedUserSignInData() {
  return cachedSignInData;
}

/**
 * Assumes this is only available when already logged in, so no host check
 * is performed.
 */
export function requestUserSignOut() {
  return window.fetch(signInHost + SIGN_OUT_API_ENDPOINT, {
    method: 'POST',
    credentials: signInCredentials,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.status);
    }

    store.dispatch({ type: USER_SIGNED_OUT });
  });
}
