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
 *
 * @param {string} url - any possible variation of a Gist URL
 * @returns {Boolean}
 */
export function isGistURL(url) {
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
 *
 * @param {string} url - any possible variation of a Gist URL
 * @returns {string} url - https://api.github.com/gists/{gistId}
 * @todo This function does not respect requests for specific commit
 *      SHAs or different files within a gist.
 */
export function getGistURL(url) {
    // The last capture group of the RegExp should be the gistID
    const gistId = url.match(gistIdRegexp).pop();
    return 'https://api.github.com/gists/' + gistId;
}

/**
 * Given any Gist URL (it should pass the isGistURL() test, above),
 * this initiates a Fetch request for the Gist API's single gist
 * manifest endpoint. Returns a promise that is fulfilled with the
 * value that is the Tangram YAML scene file's raw URL.
 *
 * Errors should be caught by the calling module.
 *
 * @param {string} url - any possible variation of a Gist URL
 * @returns {Promise} fulfilled with scene file's raw URL value
 */
export function getSceneURLFromGistAPI(url) {
    // Make sure that the URL is the Gist API's single gist manifest endpoint.
    url = getGistURL(url);

    return window.fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response.json();
        })
        .then(gist => {
            let yamlFile;

            // Iterate through gist.files, an object whose keys are the filenames of each file.
            // Find the first file with type "text/x-yaml".
            for (const id in gist.files) {
                const file = gist.files[id];
                if (file.type === 'text/x-yaml') {
                    yamlFile = file;
                    break;
                }
            }

            // In the future, we will have to be smarter than this -- there might be
            // multiple files, or it might be in a different format. But for now,
            // we assume there's one Tangram YAML file and that the MIME-type is correct.

            if (!yamlFile) {
                throw new Error('This Gist URL doesn’t appear to have a YAML file in it!');
            }
            else {
                // Returns the file's raw_url property.
                // Loading this URL in Tangram instead of returning the "content"
                // property will preserve the original URL location, which is preferable
                // for Tangram. Don't read the "content" property directly because
                // (a) it may be truncated and (b) we would have to construct a Blob
                // URL for it anyway for Tangram, so there's no use saving an HTTP
                // request here.
                return yamlFile.raw_url;
            }
        });
}
