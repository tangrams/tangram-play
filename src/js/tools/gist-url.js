/**
 * GitHub Gist URL parsing
 */

// This regular expression tests whether the URL provided
// matches the following signatures:
//
//    https://gist.github.com/{user}/{gistId}
//    https://gist.github.com/{gistId}
//    https://api.github.com/gists/{gistId}
//    https://gist.githubusercontent.com/{user}/{gistId}
//    https://gist.githubusercontent.com/{gistId}
//
// gistIds are alphanumeric strings but do not have a fixed length.
// Each of the urls above may be followed with a forward slash
// or a period (for ".git")
const gistIdRegexp = /\/\/(?:(?:gist.github.com|gist.githubusercontent.com)(?:\/[A-Za-z0-9_-]+){0,1}|api.github.com\/gists)\/([a-z0-9]+)(?:$|\/|.)/;

/**
 * Is this a generic GitHub Gist URL?
 *
 * If the URL matches, it returns true. Otherwise, this returns false.
 * Note that this does not test whether the URL is actually a valid URL
 * string or that the gist exists.
 */
export function isGistURL (url) {
    if ((url.includes('api.github.com/gists') || url.includes('gist.github.com')) &&
        url.match(gistIdRegexp).length > 1) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Given any Gist URL (it should pass the isGistURL() test, above),
 * we return the URL endpoint for the "Get a single gist" API.
 * See: https://developer.github.com/v3/gists/#get-a-single-gist
 * The response from this API endpoint will tell us everything we need
 * to know to load a Gist, so all Gist URLs must convert to this
 * format:
 *    https://api.github.com/gists/{gistId}
 */
export function getGistURL (url) {
    // The last capture group of the RegExp should be the gistID
    const gistId = url.match(gistIdRegexp).pop();
    return 'https://api.github.com/gists/' + gistId;
}
