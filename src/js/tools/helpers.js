export function returnTrue() {}

// Cache previously generated unique integer, used by `uniqueInteger()`
let previousUniqueInteger = 0;

/**
 * Returns a locally-unique integer. These are not random (the easiest way
 * to guarantee uniqueness is just to increment the previous integer). These
 * should only be used when a unique integer is required for a single use in
 * one instance of Tangram Play and should never be used as an identifier that
 * persists across sessions. That would be bad! This function also assumes
 * that no instance of Tangram Play will ever run long enough to run out of
 * integers, although it's possible that @burritojustice might be the first to
 * do so.

 * @returns {Number}
 */
export function uniqueInteger() {
    return previousUniqueInteger++;
}

/**
 * Checks is a string is empty.
 * Returns true if:
 *      - Falsy: null, undefined
 *      - Zero-length string
 *      - Any-length string that can be trimmed to zero-length
 *
 * @param {string} str - the string to check
 * @returns {Boolean}
 */
export function isEmptyString(str) {
    return (!str || str.trim().length === 0);
}

/**
 * Prepends a relative-protocol string to the beginning of a url.
 *
 * @param {string} url
 */
export function prependProtocolToUrl(url) {
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
        return `//${url}`;
    }

    // If the string does already start with a protocol (scheme), return it as is.
    return url;
}

/**
 * Interprets a file name from a URL.
 * Given a url like http://somewhere.com/dir/scene.yaml, returns what looks
 * like the filename, e.g. `scene.yaml`.
 *
 * @param {string} url - the input url string
 * @returns {string} filename - a best guess.
 */
export function getFilenameFromUrl(url) {
    const filenameParts = url.split('/');
    const filename = filenameParts[filenameParts.length - 1];
    return filename;
}

/**
 * Gets a base path from a URL.
 * Borrowed from Tangram Utils - https://github.com/tangrams/tangram/blob/31b01b305968230c037fea0c7e05669eea3f9fb6/src/utils/utils.js#L57
 *
 * @param {string} url - the input url string
 * @returns {string} path string
 */
export function getBasePathFromUrl(url) {
    if (typeof url === 'string' && url.search(/^(data|blob):/) === -1) {
        const qs = url.indexOf('?');
        if (qs > -1) {
            url = url.substr(0, qs);
        }

        const hash = url.indexOf('#');
        if (hash > -1) {
            url = url.substr(0, hash);
        }

        return url.substr(0, url.lastIndexOf('/') + 1) || '';
    }
    return '';
}

/**
 * Determines current device pixel ratio (e.g. Retina screens have a ratio of 2).
 *
 * @param {Context} ctx - canvas context to check
 * @return {Number} ratio
 */
export function getDevicePixelRatio(ctx) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
}
