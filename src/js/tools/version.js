/**
 * Tools for working with version numbers
 */
import VERSION from '../version.json';
import store from '../store';
import { SET_RECENT_VERSION } from '../store/actions';

/**
 * Barebones parsing of a version string to an object representing SemVer values.
 * Assumes the version string is well-formed. Does not parse extensions (for
 * example, the `-beta.2` in a string like "1.0.0-beta.2". Does not account for
 * strings that include a `v` in the beginning. Like I said, this is barebones!
 *
 * @param {String} v - version string to parse
 * @returns {Object} obj - object containing semver parts
 */
export function parseVersionString(v) {
  const s = v.split('.');
  return {
    major: Number(s[0]),
    minor: Number(s[1]),
    patch: Number(s[2]),
  };
}

/**
 * Returns true if current application minor version is greater than the
 * last minor version stored in persistent session settings.
 *
 * @param {string} currentVersion - the current version. Defaults to app version
 *        stored in VERSION. Set this parameter for testing.
 * @param {string} lastVersion - the last stored version. Set this parameter for
 *        testing.
 * @returns {Boolean}
 */
export function isNewMinorVersion(currentVersion = VERSION, prevVersion) {
  const version = parseVersionString(currentVersion);
  let lastVersion;
  if (!prevVersion) {
    const persistence = store.getState().persistence;
    const lastVersionString = persistence.mostRecentVersion || '0.0.0';
    lastVersion = parseVersionString(lastVersionString);
  } else {
    lastVersion = parseVersionString(prevVersion);
  }
  return (version.major > lastVersion.major ||
    (version.major === lastVersion.major && version.minor > lastVersion.minor));
}

/**
 * Records the current application version in persistent session settings.
 *
 * @returns {undefined}
 */
export function recordCurrentVersion() {
  store.dispatch({
    type: SET_RECENT_VERSION,
    version: VERSION.v,
  });
}
