export function returnTrue() {}

// Cache previously generated unique integer, used by `uniqueInteger()`
let uniqueIntegerCounter = 0;

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
  uniqueIntegerCounter += 1;
  return uniqueIntegerCounter;
}

/**
 * Count the number of whitespace characters at the beginning of a string.
 *
 * @param {string} str - string to test
 * @param {Number} spaces - 0 if no spaces, 1 or more if spaces
 */
export function countLeadingSpaces(str) {
  // Regex for index of first non-whitespace character, or end of line
  return str.search(/\S|$/);
}

/**
 * Checks to see if a string is an absolute URI (fully-qualified) - that is,
 * not a relative path. It checks by seeing if the string begins with what
 * looks like a URI scheme with two following slashes. It does not hard-check
 * for scheme validity.
 *
 * @param {string} url string to test
 * @returns {Boolean} true if url is an absolute URI (fully-qualified), false otherwise
 */
export function isAbsoluteUrl(url) {
  // Look for whether or not the url string appears to begin with a valid
  // scheme. "The scheme consists of a sequence of characters beginning with
  // a letter and followed by any combination of letters, digits, plus (+),
  // period (.), or hyphen (-)." (Wikipedia) It also checks for two slashes.
  // "This is required by some schemes and not required by some others."
  // But we will assume it is required here.
  const schemePattern = /([a-zA-Z0-9+.-]+:)?\/\//;

  return url.search(schemePattern) === 0;
}

/**
 * Prepends a relative-protocol string to the beginning of a url.
 *
 * @param {string} url
 */
export function prependProtocolToUrl(url) {
  // We have two checks. The first is whether the url string begins with a
  // valid scheme (via `isAbsoluteUrl()`).

  // If the url string does not begin with a valid scheme, we also check if it
  // looks like a domain name. This test expects the domain name to be
  // followed by a slash, otherwise file extension will look like a TLD.
  // Be sure to take into account "localhost" and port numbers.
  const domainPattern = /((([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]+)|localhost)(:[0-9]+)?\//;

  // The string MUST start with this pattern. If not, append only the slashes
  // to make this a protocol-relative URL. This is because we cannot guess
  // whether the desired protocol is https://, http:// or something else. However,
  // we can let the browser decide.
  if (isAbsoluteUrl(url) === false && url.search(domainPattern) === 0) {
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
  const filenameParts = url.split('#')[0].split('?')[0].split('/');
  const filename = filenameParts[filenameParts.length - 1];
  return filename;
}

/**
 * Interprets a file name and base path for a URL.
 * Given a url like http://somewhere.com/dir/scene.yaml, returns an array
 * containing what like the filename, e.g. `scene.yaml` in index 1, and the
 * remainder of the url string in index 0, preserving protocol, hostname, and
 * port, but removing query strings and hash fragments.
 *
 * @param {string} url - the input url string
 * @returns {Array} url parts - a best guess.
 */
export function splitUrlIntoFilenameAndBasePath(url) {
  const filenameParts = url.split('#')[0].split('?')[0].split('/');
  const filename = filenameParts.pop();

  // Rejoin base path parts and make sure it contains a trailing slash
  filenameParts.push('');
  const basePath = filenameParts.join('/');
  return [basePath, filename];
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
