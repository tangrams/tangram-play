/**
 * Creates a thumbnail from image source or image data.
 * Designed to work well with base64 input (e.g. a canvas.toDataURL() result.
 *
 * The thumbnail is created by scaling the image to cover the desired thumbnail
 * size then cropping it, but doing it in a canvas, and returning a Promise
 * object representing the result of the operation. Its resolved value is the
 * base64 representation of the thumbnail image. Note that this operation does
 * not do any other kind of image optimization (e.g. sharpening, compression)/
 *
 * @param {string} imageData - base64 representation of image data
 * @param {Number} targetWidth - desired thumbnail width in pixels
 * @param {Number} targetHeight - desired thumbnail height in pixels
 * @param {Boolean} retina - if true, the result thumbnail is 2x its target size
 * @returns {Promise}
 */
export function createThumbnail (imageData, targetWidth, targetHeight, retina = true) {
    // Create an in-memory canvas to render the original image data to.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas width
    // Canvas should be set to 2x so that the result images are
    // appropriate for Retina screens
    if (retina) {
        targetWidth = targetWidth * 2;
        targetHeight = targetHeight * 2;
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Wraps image loading in a Promise object and returns it
    return new Promise(function (resolve, reject) {
        var image = new Image();

        image.onload = function () {
            const aspectRatio = targetWidth / targetHeight;
            const origAspectRatio = image.width / image.height;
            let diffRatio, sourceWidth, sourceHeight, sourceX, sourceY;

            // We need to do a bunch of math to figure out where on
            // the image to crop in order to fit the target dimensions.
            // If the original image has an aspect ratio less than or
            // equal to the target thumbnail's aspect ratio, (e.g. the
            // original is portrait while the target is landscape) then
            // the width of the thumbnail is the full width of the original
            // image (and the top and bottom of the original is cropped).
            // Vice versa, if the original image has an aspect ratio larger
            // than the target thumbnail's aspect ratio, then the height
            // of the thumbnail is the full height of the original image
            // (and the left and right sides of the original are cropped).
            if (origAspectRatio <= aspectRatio) {
                diffRatio = image.width / targetWidth;
                sourceWidth = image.width;
                sourceHeight = Math.round(targetHeight * diffRatio);
                sourceX = 0;
                sourceY = Math.round((image.height / 2) - (sourceHeight / 2));
            }
            else {
                diffRatio = image.height / targetHeight;
                sourceWidth = Math.round(targetWidth * diffRatio);
                sourceHeight = image.height;
                sourceX = Math.round((image.width / 2) - (sourceWidth / 2));
                sourceY = 0;
            }

            // Draws the source image to the canvas. This does the scaling and cropping.
            context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

            // Returns the thumbnail's dataURL value as the resolve value of this Promise
            resolve(canvas.toDataURL());
        };

        image.onerror = function () {
            reject('Unable to create thumbnail.');
        };

        image.src = imageData;
    });
}
