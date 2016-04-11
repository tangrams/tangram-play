/**
 * GitHub Gist URL parsing
 *
 * Given a URL string, detect if the URL is a GitHub Gist URL. If so,
 * return the link to the raw YAML form for Tangram Play.
 * If it is not a GitHub Gist URL, pass the original input through.
 */

const gistIdRegexp = /\/\/(?:(?:gist.github.com|gist.githubusercontent.com)(?:\/[A-Za-z0-9_-]+){0,1}|api.github.com\/gists)\/([a-z0-9]+)(?:$|\/|.)/;

/**
 * Is this a generic GitHub Gist URL?
 * This should test whether the URL provided matches signatures of:
 *
 *    https://gist.github.com/user/gistId
 *    https://gist.github.com/gistId
 *    https://api.github.com/gists/gistId
 *    https://gist.githubusercontent.com/user/gistId
 *    https://gist.githubusercontent.com/gistId
 *
 * gistIds are alphanumeric strings but do not have fixed length.
 * Each of the urls above may be followed with a forward slash
 * or a period (for ".git")
 *
 * If the URL matches, it returns true. Otherwise, this returns false.
 * Note that this does not test whether the URL is actually a valid URL
 * string or that the gist exists.
 */
export function isGistURL (value) {
  if ((value.includes('api.github.com/gists') || value.includes('gist.github.com')) &&
    value.match(gistIdRegexp).length > 1) {
    return true;
  }
  else {
    return false;
  }
}

export function getGistURL (value) {
  // The last capture group of the RegExp should be the gistID
  const gistId = value.match(gistIdRegexp).pop();
  return 'https://api.github.com/gists/' + gistId;
}
//https://gist.githubusercontent.com/anonymous/6cd74ed889519d7426179ceec1e287d7/raw/2694028ba2263a79b450e1fab14bc2a02839fc1d/scene.yaml
