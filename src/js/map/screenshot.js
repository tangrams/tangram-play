import { saveAs } from '../vendor/FileSaver.min.js';
import { map, tangramScene } from './map';

/**
 * Uses Tangram's native screenshot functionality to download an image.
 *
 * @public
 * @requires FileSaver
 */
export function takeScreenshot () {
    tangramScene.screenshot().then(function (result) {
        const slug = createFilenameSlug(map);

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
export function getScreenshotData () {
    return tangramScene.screenshot().then(function (result) {
        return result;
    });
}

/**
 * Utility function to generate a filename slug from current date and
 * current map view properties.
 *
 * @param {Leaflet} map - we'll get the map view data from this.
 * @returns {string} - see format in comments, inline
 */
function createFilenameSlug (map) {
    const date = new Date();

    // Get string values for each portion of the date, left-padding the
    // trailing 0 if necessary.
    const year = date.getFullYear().toString();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 0-indexed, add 1
    const day = ('0' + date.getDate()).slice(-2);
    const hour = ('0' + date.getHours()).slice(-2); // 24-hour clock.
    const minute = ('0' + date.getMinutes()).slice(-2);
    const second = ('0' + date.getSeconds()).slice(-2);

    // Get map view
    const center = map.getCenter();
    const zoom = map.getZoom().toFixed(4).toString();
    const lat = center.lat.toFixed(4).toString();
    const lng = center.lng.toFixed(4).toString();

    // String format, eg.
    // 2016-07-29 12.59.16 z8.7067.x76.2119.y-60.8138
    return `${year}-${month}-${day} ${hour}.${minute}.${second} z${zoom}.x${lat}.y${lng}`;
}
