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
 * @param {string} queryString - Optional. Defaults to window.location.search
 * @returns {Object} deserialized key-value pairs
 */
export function getQueryStringObject(queryString = window.location.search) {
  const params = new window.URLSearchParams(queryString);
  const object = {};

  for (const param of params.entries()) {
    const [key, value] = param;

    // Do not assign if key is a blank string or
    // if value is undefined. Do not test for 'falsy'
    // values, which are valid keys and values.
    if (key !== '' && typeof value !== 'undefined') {
      object[key] = value;
    }
  }

  return object;
}

/**
 * Convenience function for returning a parameter from current query string.
 *
 * @param {string} param - Search param to get
 * @param {string} queryString - Optional. Defaults to window.location.search
 * @returns {string} value - value, if present; otherwise returns `null`
 */
export function getURLSearchParam(param, queryString = window.location.search) {
  const params = new window.URLSearchParams(queryString);
  return params.get(param);
}

/**
 * Merges an object containing new parameters into a query string. If no
 * query string is provided, a new, empty URLSearchParams object is created.
 *
 * @param {Object} params - new parameters to add, change or remove from the
 *          query string. This object is merged into an instance of the
 *          URLSearchParams interface.
 *          To delete an existing query string, pass in a property whose value
 *          is `null`.
 *          Params are added or replaced; we do not append them.
 * @param {string} queryString - Optional. the query string to merge params
 *          into. Defaults to window.location.search
 * @returns {string} newQueryString - a new query string.
 */
export function mergeParamObjectToQueryString(params = {}, queryString = window.location.search) {
  const searchParams = new window.URLSearchParams(queryString);

  Object.entries(params).forEach((param) => {
    const [key, value] = param;

    if (value === null) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  });

  // URLSearchParams.toString() does not return the prepended `?`, so add it
  const newQueryString = `?${searchParams.toString()}`;

  return newQueryString;
}

/**
 * Replaces existing history state using `window.history.replaceState()`.
 * We assume the same path (Tangram Play has no server-side handled routes)
 * and hash (this is managed by leaflet-hash), and only the query strings
 * are modified.
 *
 * @param {Object} params - parameters to add, change or remove from the
 *          query string.
 */
export function replaceHistoryState(params = {}) {
  const locationPrefix = window.location.pathname;
  const queryString = mergeParamObjectToQueryString(params);

  // Browser security policies prevent manipulating history where the URL
  // includes 'http://localhost', even if it's the current origin. So we do
  // routing as a relative URL so that it doesn't trip any browser warnings.
  // Also, keep the original hash -- it is handled by leaflet-hash.
  window.history.replaceState({}, null, locationPrefix + queryString + window.location.hash);
}

/**
 * Like `replaceHistoryState()`, this pushes a new history state, using
 * `window.history.pushState()`. The only exception is that the params passed
 * into this function are not merged with the current query strings (we assume
 * you want a fresh state) and we also pass it to the first parameter
 * for `pushState()`.
 *
 * @param {Object} params - new parameters to create a new history state.
 */
export function pushHistoryState(params = {}) {
  const locationPrefix = window.location.pathname;
  const queryString = mergeParamObjectToQueryString(params, '');

  // See comment for similar line in `replaceHistoryState()`.
  window.history.pushState(params, null, locationPrefix + queryString + window.location.hash);
}
