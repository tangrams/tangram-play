/**
 * Mapzen vector tile service API key
 *
 * Scene files that use Mapzen's vector tile service, but do not have API keys,
 * should have an API key injected so that they can still be properly rendered
 * by Tangram. This default key should always be masked and not seen by the end user.
 *
 * The URL_PATTERN handles the old vector.mapzen.com origin (until it is fully
 * deprecated) as well as the new v1 tile.mapzen.com endpoint.
 */
const URL_PATTERN = /((https?:)?\/\/(vector|tile).mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|:)+(topojson|geojson|mvt))/;

/**
 * Parses a Tangram scene config object for sources that specify a Mapzen
 * vector tile service URL, and injects an API key if it does not have one.
 * Do not inject an API key if the vector tile service is not hosted at
 * vector.mapzen.com or tile.mapzen.com. This is better than parsing the
 * string content of the file because the config object has already been
 * compiled and manipulating that JS object directly is faster and less error
 * prone.
 *
 * @param {Object} config - Tangram scene config object
 * @param {string} apiKey - the API key to inject
 * @returns {Object} config - a scene config object with injected keys, if needed
 */
export function injectAPIKey(config, apiKey) {
  Object.entries(config.sources).forEach((entry) => {
    const [key, value] = entry;

    // Only operate on the URL if it's a Mapzen-hosted vector tile service
    // and if it does not appear to contain a api_key param in the query string
    if (value.url.match(URL_PATTERN) && !value.url.match(/(\?|&)api_key=/)) {
      // If it does not already have a url_params.api_key field
      if (!(value.url_params && value.url_params.api_key)) {
        // Add a default API key as a url_params setting.
        // Preserve existing url_params values, if present.
        const params = Object.assign({}, config.sources[key].url_params, {
          api_key: apiKey,
        });

        // Mutate the original on purpose.
        // eslint-disable-next-line no-param-reassign
        config.sources[key].url_params = params;
      // If it has an api_key field but it refers to a global, replace the
      // global if it is a falsy or blank value.
      } else if (value.url_params && value.url_params.api_key && value.url_params.api_key.startsWith('global.')) {
        // Check the value of the global property
        const prop = value.url_params.api_key.split('.')[1];
        const val = config.global[prop];
        if (!val || val.trim().length === 0) {
          // Mutate the original on purpose.
          // eslint-disable-next-line no-param-reassign
          config.global[prop] = apiKey;
        }
      }
    }
  });

  return config;
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
