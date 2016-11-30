import localforage from 'localforage';
import { uniqWith, isEqualWith, reject } from 'lodash';

const STORAGE_BOOKMARKS_KEY = 'bookmarks';

/**
 * Gets location bookmarks.
 * This is asynchronous and returns a Promise.
 *
 * @returns {Promise} - resolved value is current bookmarks content
 */
export function getLocationBookmarks() {
  return localforage.getItem(STORAGE_BOOKMARKS_KEY)
    // If not set previously, then this value is null, so return an
    // empty array.
    .then(bookmarks => bookmarks || []);
}

/**
 * Saves a new location bookmark to the list of bookmarks
 * This is asynchronous and returns a Promise.
 *
 * @param {Object} newBookmark - an object having the following signature:
 *      {
            label, // String - name of the location.
            lat,   // Number - latitude
            lng,   // Number - longitude
            zoom,  // Number - zoom level
            timestamp, // String - date string
        }
 * @returns {Promise} - resolved value is current bookmarks content after save
 */
export function saveLocationBookmark(newBookmark) {
  return getLocationBookmarks()
    .then((bookmarks) => {
      bookmarks.push(newBookmark);

      // In case we try to add a bookmark that already exists, we
      // dedupe this array by performing a equality comparison between
      // the properities `label`, `lat`, `lng` and `zoom` of each object.
      // (Don't compare by unique id like `timestamp` which defeats the purpose)
      function eqWithCustomizer(objectValue, otherValue) {
        return (objectValue.label === otherValue.label &&
          objectValue.lat === otherValue.lat &&
          objectValue.lng === otherValue.lng &&
          objectValue.zoom === otherValue.zoom);
      }

      function uniqWithComparator(objectValue, otherValue) {
        return isEqualWith(objectValue, otherValue, eqWithCustomizer);
      }

      const uniqueBookmarks = uniqWith(bookmarks, uniqWithComparator);

      return localforage.setItem(STORAGE_BOOKMARKS_KEY, uniqueBookmarks);
    });
}

/**
 * Delete only one bookmark, given a unique identifier. We will use the `_date`
 * property as this unique id. Do not delete by array index, since there is no
 * guarantee that a React view's index value will match what's in the storage.
 *
 * @param {string} uid - unique identifier for bookmark.
 * @returns {Promise} - resolved value is current bookmarks content after delete
 */
export function deleteLocationBookmark(uid) {
  return getLocationBookmarks()
    .then((bookmarks) => {
      // Reject the bookmark with this given uid
      const updatedBookmarks = reject(bookmarks, { timestamp: uid });

      return localforage.setItem(STORAGE_BOOKMARKS_KEY, updatedBookmarks);
    });
}

/**
 * Clear all current bookmarks by replacing it with an empty array.
 *
 * @returns {Promise} - resolved value is empty array
 */
export function clearLocationBookmarks() {
  return localforage.setItem(STORAGE_BOOKMARKS_KEY, []);
}
