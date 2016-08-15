/**
 * This isn't really a router, since Tangram Play currently does not use any
 * routes. But it does store some information about the state of the
 * application in the URL query string. This module handles managing this
 * URL state and updates the location by using the History API (pushState or
 * replaceState). Do not modify window.location or window.history on your own!
 */

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
export function serializeToQueryString (obj = {}) {
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
