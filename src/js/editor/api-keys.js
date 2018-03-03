/**
 * Nextzen vector tile service API key
 *
 * Scene files that use Nexzen's vector tile service, but do not have API keys,
 * should have an API key injected so that they can still be properly rendered
 * by Tangram. This default key should always be masked and not seen by the end user.
 *
 * Extensions include both vector and raster tile services.
 */
const URL_PATTERN = /((https?:)?\/\/tiles?.nextzen.org([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\||:)+(topojson|geojson|mvt|png|tif|gz))/;

/**
 * Parses a Tangram scene config object for sources that specify a Nextzen
 * vector tile service URL, and injects an API key if it does not have one.
 * Do not inject an API key if the vector tile service is not hosted at
 * nextzen.org. This is better than parsing the
 * string content of the file because the config object has already been
 * compiled and manipulating that JS object directly is faster and less error
 * prone.
 *
 * This mutates the original `config` object by necessity. Tangram does not
 * expect it to be passed back in after it's modified. Instead, this function
 * returns a boolean that indicates whether an API key was injected, which
 * allows Tangram Play to further handle this condition.
 *
 * @param {Object} config - Tangram scene config object
 * @param {string} apiKey - the API key to inject
 * @returns {Boolean} didInjectKey - whether or not a key was injected
 */
export function injectAPIKey(config, apiKey) {
  let didInjectKey = false;

  Object.entries(config.sources).forEach((entry) => {
    const [key, value] = entry;
    let valid = false;

    // Only operate on the URL if it's a Mapzen-hosted vector tile service
    if (!value.url.match(URL_PATTERN)) return;

    // Check for valid API keys in the source.
    // First, check the url_params.api_key field
    // Tangram.js compatibility note: Tangram >= v0.11.7 fires the `load`
    // event after `global` property substitution, so we don't need to manually
    // check global properties here.
    if (value.url_params && value.url_params.api_key) {
      valid = true;
    // Next, check if there is an api_key param in the query string
    } else if (value.url.match(/(\?|&)api_key=[-a-z]+-[0-9a-zA-Z_-]{7}/)) {
      valid = true;
    }

    if (!valid) {
      // Add a default API key as a url_params setting.
      // Preserve existing url_params if present.
      const params = Object.assign({}, config.sources[key].url_params, {
        api_key: apiKey,
      });

      // Mutate the original on purpose.
      // eslint-disable-next-line no-param-reassign
      config.sources[key].url_params = params;
      didInjectKey = true;
    }
  });

  return didInjectKey;
}

/**
 * Parses Tangram YAML content for certain vector tile service API keys
 * that should be suppressed, and removes it from the scene file content.
 * This should be done before displaying a scene file in the editor. Note
 * that the suppressed key is only masked in the editor, but will remain
 * in memory and continue to be used to make requests until the scene is
 * reloaded, either with the user's own key or with an injected key.
 *
 * @todo In future, this can be extended to mask other API keys that the user
 *    should not be seeing, e.g. keys that do not belong to a logged-in user
 *
 * @param {string} content - Tangram YAML content, possibly with API keys
 * @param {Array} suppressedKeys - an array of keys to mask
 * @returns {string} content - Tangram YAML with API keys suppressed, if needed
 */
export function suppressAPIKeys(content, suppressedKeys) {
  // Creates a string for the regex, e.g.
  // "vector\-tiles\-P6dkVl4|vector\-tiles\-HqUVidw|vector\-tiles\-JUsa0Gc"
  const escapedKeys = suppressedKeys.map(key => key.replace(/-/g, '\\-')).join('|');
  const re = new RegExp(`${URL_PATTERN.source}\\?api_key\\=(${escapedKeys})`, 'gm');
  return content.replace(re, '$1');
}
