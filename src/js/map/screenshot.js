import { saveAs } from 'file-saver';
import { map, tangramScene } from './map';

/**
 * Utility function to generate a filename slug from current date and
 * current map view properties.
 *
 * @returns {string} - see format in comments, inline
 */
function createFilenameSlug() {
  const date = new Date();

  // Get string values for each portion of the date, left-padding the
  // trailing 0 if necessary.
  /* eslint-disable prefer-template */
  const year = date.getFullYear().toString();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // 0-indexed, add 1
  const day = ('0' + date.getDate()).slice(-2);
  const hour = ('0' + date.getHours()).slice(-2); // 24-hour clock.
  const minute = ('0' + date.getMinutes()).slice(-2);
  const second = ('0' + date.getSeconds()).slice(-2);
  /* eslint-enable prefer-template */

  // Get map view
  const center = map.getCenter();
  const zoom = map.getZoom().toFixed(4).toString();
  const lat = center.lat.toFixed(4).toString();
  const lng = center.lng.toFixed(4).toString();

  // String format, eg.
  // @8.7067&76.2119&-60.8138_2016-07-29_12.59.16
  // @z&x&y is so that it can be pasted back into a hash in the URL.
  // (Unfortunately forward slashes are not file system friendly.)
  return `@${zoom}&${lat}&${lng}_${year}-${month}-${day}_${hour}.${minute}.${second}`;
}

/**
 * Uses Tangram's native screenshot functionality to download an image.
 *
 * @public
 * @requires FileSaver
 */
export function takeScreenshot() {
  tangramScene.screenshot().then((result) => {
    const slug = createFilenameSlug();

    // uses FileSaver.js: https://github.com/eligrey/FileSaver.js/
    saveAs(result.blob, `tangram-${slug}.png`);
  });
}

/**
 * Uses Tangram's native screenshot functionality to return a Promise
 * whose resolve function passes in an object containing two properities:
 *      blob - a Blob object representing the image binary
 *      url - a string containing a base64 data-URI
 *
 * @public
 * @returns Promise
 */
export function getScreenshotData() {
  return tangramScene.screenshot();
}
