import { saveAs } from '../vendor/FileSaver.min.js';
import { tangramScene } from './map';

/**
 * Uses Tangram's native screenshot functionality to download an image.
 *
 * @public
 * @requires FileSaver
 */
export function takeScreenshot () {
    tangramScene.screenshot().then(function (result) {
        const slug = createFilename();

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
 * @returns {string}
 */
function createFilename () {
    let slug = new Date().toString();

    return slug;
}
