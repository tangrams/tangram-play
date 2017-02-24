/**
 * A node script for fetching and saving example scene files for Tangram Play
 * locally. For more information, see README.md in this directory.
 */
'use strict';

// Keep dependencies low, only use Node.js native modules
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const IMAGE_SOURCES = require('./sources');
const WRITE_PATH = '../../public/data/scenes';

for (let name in IMAGE_SOURCES) {
  const url = IMAGE_SOURCES[name].scene;

  // Not all scenes have urls to cache; move on to the next if that's the case
  if (!url) {
    continue;
  }

  const destination = path.resolve(__dirname, WRITE_PATH, name + '.yaml');

  // Depending on the URL's protocol, Node either needs the `http` or `https`
  // module.
  const protocol = url.startsWith('https') ? https : http;

  protocol.get(url, (response) => {
    // Continuously update stream with data
    let body = '';
    response.on('data', function (data) {
      body += data;
    });
    response.on('end', function () {
      // Data reception is done, save it to destination
      fs.writeFile(destination, body, (err) => {
        if (err) {
          throw err;
        }
        console.log(`${destination} - done.`);
      });
    });
  });
}
