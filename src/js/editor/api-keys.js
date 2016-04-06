/**
 * Mapzen vector tile service API key
 *
 * Scene files that use Mapzen's vector tile service, but do not have API keys,
 * should have "our own" default key injected so that it can still be rendered
 * properly by Tangram. This default key should always be masked and not
 * exposed to the end user -- we don't want anyone copy-pasting it.
 */

// Default vector tile service API key
// This tile is owned by Mapzen
const DEFAULT_API_KEY = 'vector-tiles-P6dkVl4';

/**
 * Parses Tangram YAML content for URL references to Mapzen vector tile service
 * and injects an API key if it does not have one.
 *
 * @param {string} content - Tangram YAML content
 * @returns {string} content - Tangram YAML with API keys injected, if needed
*/
export function injectAPIKeys (content) {
    const pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
    const result = `$1?api_key=${DEFAULT_API_KEY}`;
    return content.replace(pattern, result);
}

/**
 * Parses Tangram YAML content for the default vector tile service API key
 * and masks it. Do this before displaying a scene file in the editor.
 *
 * @todo In future, this can be extended to mask other API keys that the user
 *    should not be seeing, e.g. keys that do not belong to a logged-in user
 *
 * @param {string} content - Tangram YAML content, possibly with API keys
 * @returns {string} content - Tangram YAML with API keys suppressed, if needed
*/
export function suppressAPIKeys (content) {
    const escapedApiKey = DEFAULT_API_KEY.replace(/\-/g, '\\-');
    const re = new RegExp(`\\?api_key\\=${escapedApiKey}`, 'gm');
    return content.replace(re, '');
}
