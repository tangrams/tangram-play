/**
 * Mapzen vector tile service API key
 *
 * Scene files that use Mapzen's vector tile service, but do not have API keys,
 * should have an API key injected so that they can still be properly rendered
 * by Tangram. This default key should always be masked and not seen by the end user.
 */

const URL_PATTERN = /((https?:)?\/\/vector.mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|:)+(topojson|geojson|mvt))/;

/**
 * Parses Tangram YAML content for URL references to Mapzen vector tile service
 * and injects an API key if it does not have one. Do not inject an API key
 * if the vector tile service is not hosted at vector.mapzen.com.
 *
 * TODO: Only inject API keys if it matches the source/url mapping.
 * Currently it checks if a line begins with the "url: " key, but there are
 * other ways of writing this that this function won't catch, e.g. inline YAML,
 * global properties or YAML variables.
 *
 * @param {string} content - Tangram YAML content
 * @param {string} apiKey - the API key to inject
 * @returns {string} content - Tangram YAML with API keys injected, if needed
*/
export function injectAPIKey (content, apiKey) {
    const pattern = new RegExp('(^\\s+url:\\s+' + URL_PATTERN.source + '$)', 'gm');
    // Do not use a template string here, seems incompatible with the $1 from the regex pattern
    const result = '$1?api_key=' + apiKey;
    return content.replace(pattern, result);
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
export function suppressAPIKeys (content, suppressedKeys) {
    // Creates a string for the regex, e.g.
    // "vector\-tiles\-P6dkVl4|vector\-tiles\-HqUVidw|vector\-tiles\-JUsa0Gc"
    const escapedKeys = suppressedKeys.map(function (key) {
        return key.replace(/\-/g, '\\-');
    }).join('|');
    const re = new RegExp(URL_PATTERN.source + `\\?api_key\\=(${escapedKeys})`, 'gm');
    return content.replace(re, '$1');
}
