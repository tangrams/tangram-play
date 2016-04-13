/**
 * Mapzen vector tile service API key
 *
 * Scene files that use Mapzen's vector tile service, but do not have API keys,
 * should have "our own" default key injected so that they can still be rendered
 * properly by Tangram. This makes examples that do not have API keys easily
 * accessible, or examples that use the DEFAULT_API_KEY work without making it
 * easily or accidentally copy-pastable. This default key should always be masked
 * and not exposed to the end user.
 */

// Default vector tile service API key
// This key is owned by Mapzen
const DEFAULT_API_KEY = 'vector-tiles-P6dkVl4';

/**
 * Parses Tangram YAML content for URL references to Mapzen vector tile service
 * and injects an API key if it does not have one.
 *
 * This behavior must be pretty strict, since DEFAULT_API_KEY only applies to
 * the service hosted at vector.mapzen.com.
 *
 * TODO: Only inject API keys if it matches the source/url mapping.
 * Currently it checks if a line begins with the "url: " key, but there are
 * other ways of writing this that this function won't catch.
 *
 * @param {string} content - Tangram YAML content
 * @returns {string} content - Tangram YAML with API keys injected, if needed
*/
export function injectAPIKeys (content) {
    const pattern = /(^\s+url:\s+(https?:\/\/)vector.mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
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
