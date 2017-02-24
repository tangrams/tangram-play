/**
 * A node script for making the thumbnails for scene files displayed in
 * Tangram Play's "Open an example" modal. For more information, see
 * README.md in this directory.
 *
 * You may edit this script to update image dimensions.
 *
 * To run this script, you will need a native installation of ImageMagick.
 * On Mac OS X, you can use Homebrew:
 *
 *      brew install imagemagick
 *
 * Then run this script with node
 *
 *      node ./meta/example-scenes/cache-thumbnails.js
 *
 * Can this be done in a shell script? Probably!
 */
'use strict';

const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');

const IMAGE_SOURCES = require('./sources');
const THUMBNAIL_WIDTH = 245;
const THUMBNAIL_HEIGHT = 60;
const RETINA_MULTIPLIER = 2;
const WRITE_PATH = '../../public/data/scenes/thumbnails';

for (let name in IMAGE_SOURCES) {
  const url = IMAGE_SOURCES[name].image;
  const forcePNG = IMAGE_SOURCES[name].forcePNG || false;
  const destination = path.resolve(__dirname, WRITE_PATH);

  // If we want to force an animated GIF to be a one-frame PNG, we fetch the
  // url with a `[0]`
  const fetchURL = forcePNG ? url + '[0]' : url;

  gm(fetchURL)
    .format(function (err, value) {
      if (err) {
        console.log(`Error: unable to determine format for ${url}: ${err}`);
        return;
      }

      let ext = value.toLowerCase();
      if (forcePNG === true) {
        ext = 'png';
      }

      const filename = path.resolve(destination, name + '.' + ext);
      const width = THUMBNAIL_WIDTH * RETINA_MULTIPLIER;
      const height = THUMBNAIL_HEIGHT * RETINA_MULTIPLIER;

      this.coalesce() // This is required to fix resizing problems with animated GIFs
        .resize(width, height, '^')
        .gravity('Center')
        .extent(width, height)
        .interlace('Line')
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
