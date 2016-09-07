export function returnTrue() {}

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
