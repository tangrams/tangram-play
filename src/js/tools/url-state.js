/**
 * This isn't really a router, since Tangram Play currently does not use any
 * routes. But it does store some information about the state of the
 * application in the URL query string. This module handles managing this
 * URL state and updates the location by using the History API (pushState or
 * replaceState). Do not modify window.location or window.history on your own!
 */

/**
 * Replaces existing history state using `window.history.replaceState()`.
 * We assume the same path (Tangram Play has no server-side handled routes)
 * and hash (this is managed by leaflet-hash), and only the query strings
 * are modified.
 *
 * @param {Object} props - new properties to add, change or remove from the
 *          query string. This object is merged into a source object representing
 *          the current query strings and then re-serialized into a url string.
 *          To delete an existing query string, pass in a property whose value
 *          is `null`.
 */
export function replaceHistoryState (props = {}) {
    const locationPrefix = window.location.pathname;
    const currentProps = getQueryStringObject();
    const newProps = Object.assign({}, currentProps, props);
    const queryString = serializeToQueryString(newProps);

    // The new url must be a path relative to the host name because security
    // policies prevent doing a replaceState when the url contains `localhost`,
    // even when the current page is `localhost`. The relative path lets the
    // the browser handle it so we don't trip any security alarms.
    // We also keep the original hash in place -- it is handled by leaflet-hash.
    window.history.replaceState({}, null, locationPrefix + queryString + window.location.hash);
}

/**
 * Like `replaceHistoryState()`, this pushes a new history state, using
 * `window.history.pushState()`. The only exception is that the props passed
 * into this function are not merged with the current query strings (we assume
 * you want a fresh state) and we also pass it to the first parameter
 * for `pushState()`.
 *
 * @param {Object} props - See `props` param for `replaceHistoryState()`.
 *          This object is also passed to `pushState()`.
 */
export function pushHistoryState (props = {}) {
    const locationPrefix = window.location.pathname;
    const queryString = serializeToQueryString(props);

    // Browser security policies prevent doing a pushstate where the URL
    // includes 'http://localhost'. So we have to let the browser do the
    // routing relative to the server
    window.history.pushState(props, null, locationPrefix + queryString + window.location.hash);
}

/**
 * Gets a deserialized object from the current window's URL.
 * It breaks down the query string, e.g. '?scene=foo.yaml'
 * into this: { scene: "foo.yaml" }
 *
 * @param {string} queryString - defaults to window.location.search
 * @returns {Object} deserialized key-value pairs
 */
export function getQueryStringObject (queryString = window.location.search) {
    // Slices off the initial '?' separator on the string,
    // then splits the string into an array of key-value pairs
    const arr = queryString.slice(1).split('&');

    // For each key-value pair, deserialize to properties on a new object.
    const queryObj = arr.reduce(function (object, pair) {
        const keyValue = pair.split('=');
        const key = decodeURIComponent(keyValue[0]);
        const value = decodeURIComponent(keyValue[1]);

        // Do not assign if key is a blank string or
        // if value is undefined. Do not test for 'falsy'
        // values, which are valid keys and values.
        if (key !== '' && typeof value !== 'undefined') {
            object[key] = value;
        }

        return object;
    }, {});

    // The lack of a query string should still return an empty
    // object. This should not be undefined.
    return queryObj;
}

/**
 * Given an object of key-value pairs, serializes that object
 * into a valid query string. It turns { scene: "foo.yaml", bar: "baz" }
 * into '?scene=foo.yaml&bar=baz'
 *
 * @param {Object} obj - set of key-value pairs
 * @returns {string} valid facsimile for window.location.search
 */
function serializeToQueryString (obj = {}) {
    const str = [];
    for (let p in obj) {
        // Nulls or undefined are skipped. Do not test for "falsy" values
        // here. Values like `0` or `false` should be stored in the query.
        if (obj[p] === null || typeof obj[p] === 'undefined') {
            continue;
        }

        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }
    }

    // Returns a string prepended with '?' separator if
    // key value pairs are provided; otherwise, returns
    // an empty string. This allows URL-assemblage to
    // "just work" if query string is empty.
    return (str.length > 0) ? '?' + str.join('&') : '';
}
