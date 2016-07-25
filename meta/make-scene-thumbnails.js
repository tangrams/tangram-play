/**
 * A node script for making the thumbnails for scene files displayed in
 * Tangram Play's "Open an example" modal. The images are static resources
 * that will be stored directly in this repository, and deployed along with
 * Tangram Play, reducing its dependency on GitHub or RawGit to operate. This
 * is designed to run only when needed, so it is not part of the build or
 * deploy process.
 *
 * This script provides an object whose keys are the filename to save to and
 * values that are an external URL where that image resides. Each URL is
 * downloaded, resized, and cropped to the dimensions that Tangram Play expects,
 * optimized for file size and rendering, and saved to the /data/scenes/thumbnails
 * path in this repository. When this script is run, all valid URLs that match
 * existing thumbnail images will replace them. If you remove a URL here, you
 * will also have to remove the thumbnail yourself, if you need to. URLs that
 * are not valid for any reason (e.g. 404, 500 errors) are skipped with a warning.
 *
 * You may edit this script to provide new image URL sources, or update image
 * dimensions. When images are updated or created, commit the changes to the
 * repository. Be sure to update Tangram Play's `examples.json` so that the
 * correct images appear in the "Open an example" menu.
 *
 * To run this script, you will need a native installation of ImageMagick.
 * On Mac OS X, you can use Homebrew:
 *
 *      brew install imagemagick
 *
 * Then run this script with node
 *
 *      node ./meta/make-scene-thumbnails.js
 *
 * Can this be done in a shell script? Probably!
 */
'use strict';

const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');

const THUMBNAIL_WIDTH = 245;
const THUMBNAIL_HEIGHT = 60;
const RETINA_MULTIPLIER = 2;
const WRITE_PATH = '../data/scenes/thumbnails';

/* eslint-disable quote-props */
const IMAGE_SOURCES = {
    'default': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/default.png',
    'grain': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain.png',
    'grain-roads': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-roads.png',
    'grain-area': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-area.png',
    'refill': 'https://cloud.githubusercontent.com/assets/853051/11160181/87349950-8a1b-11e5-8559-5c6d95cb84d5.png',
    'cinnabar': 'https://cloud.githubusercontent.com/assets/853051/11084429/f615a860-87ef-11e5-8ca9-6c46cec3534b.png',
    'zinc': 'https://cloud.githubusercontent.com/assets/853051/11136794/c8c54190-8966-11e5-9017-b7f06d6841bb.png',
    'gotham': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/gotham.png',
    'blueprint': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/blueprint.png',
    'tron': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/tron.png',
    'matrix': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/matrix.png',
    'ikeda': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/ikeda.png',
    '9845c': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/9845C.png[0]', // Special case: force this to be a 1-frame png
    'press': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/press.png',
    'radar': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/radar.png',
    'crosshatch': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/crosshatch.png',
    'pericoli': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/pericoli.png',
    'patterns': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/patterns.png',
    'lego': 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/lego.png',
    'walkabout': 'https://s3.amazonaws.com/static-prod.mapzen.com/resources/maps-page-hero/walkabout-style.png'
};
/* eslint-enable quote-props */

for (let name in IMAGE_SOURCES) {
    const url = IMAGE_SOURCES[name];
    const destination = path.resolve(__dirname, WRITE_PATH);

    gm(url)
        .format(function (err, value) {
            if (err) {
                console.log(`Error: unable to determine format for ${url}`);
                return;
            }

            let ext = value.toLowerCase();
            // Special hard-coded case for 9845c, which is a very subtle
            // animation and results in an unnecessarily large 1MB gif, so force
            // it to be PNG.
            if (name === '9845c') {
                ext = 'png';
            }

            const filename = path.resolve(destination, name + '.' + ext);
            const width = THUMBNAIL_WIDTH * RETINA_MULTIPLIER;
            const height = THUMBNAIL_HEIGHT * RETINA_MULTIPLIER;

            this.coalesce() // This is required to fix resizing problems with animated GIFs
                .resize(width, height, '^')
                .gravity('Center')
                .extent(width, height)
                .write(filename, function (err) {
                    if (err) {
                        console.log(`Error writing ${filename}:\n ${err}`);
                    }
                    else {
                        // Success, optimize now
                        // Save as PNG or animated GIF, depending on source.
                        if (ext === 'png') {
                            imagemin([filename], destination, {
                                plugins: [
                                    imageminPngquant({ quality: '65-80' })
                                ]
                            }).then(files => {
                                console.log(`${filename} - done.`);
                            });
                        }
                        else if (ext === 'gif') {
                            imagemin([filename], destination, {
                                use: [
                                    imageminGifsicle({ optimizationLevel: 3 })
                                ]
                            }).then(() => {
                                console.log(`${filename} - done.`);
                            });
                        }
                    }
                });
        });
}
