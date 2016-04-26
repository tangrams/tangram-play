export function returnTrue () {}

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
        // Nulls or undefined is just empty string
        if (obj[p] === null || typeof obj[p] === 'undefined') {
            obj[p] = '';
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

/**
 * Empties a DOM element of all child nodes.
 * Effectively identical to jQuery's $(el).empty()
 * This is purportedly faster than clearning an element's
 * innerHTML property, e.g. el.innerHTML = '';
 *
 * @param {Node} el - the element to empty
 */
export function emptyDOMElement (el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

/**
 * Prepends a relative-protocol string to the beginning of a url.
 *
 * @param {string} url
 */
export function prependProtocolToUrl (url) {
    // Look for whether or not the url string appears to begin with a valid
    // scheme. "The scheme consists of a sequence of characters beginning with
    // a letter and followed by any combination of letters, digits, plus (+),
    // period (.), or hyphen (-)." (Wikipedia)
    const schemePattern = /([a-zA-Z0-9+.-]+:)?\/\//;

    // If the url string does not begin with a valid scheme, next check if it
    // looks like a domain name. This test expects the domain name to be
    // followed by a slash, otherwise file extension will look like a TLD.
    // Be sure to take into account "localhost" and port numbers.
    const domainPattern = /((([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]+)|localhost)(:[0-9]+)?\//;

    // The string MUST start with this pattern. If not, append only the slashes
    // to make this a protocol-relative URL. This is because we cannot necessarily
    // guess whether the protocol is https://, http:// or something else. However,
    // we can let the browser decide.
    if (url.search(schemePattern) !== 0 && url.search(domainPattern) === 0) {
        return '//' + url;
    }
    // If the string does already start with a protocol (scheme), return it as is.
    else {
        return url;
    }
}
