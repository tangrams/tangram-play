import L from 'leaflet';

import { getEditorContent } from '../editor/editor';
import { map } from '../map/map';
import { getScreenshotData } from '../map/screenshot';
// TODO: implement now that move to react has changed this
// import { getLocationLabel } from '../map/search';
import { createThumbnail } from '../tools/thumbnail';
import { getCachedUserSignInData } from '../user/sign-in';

const THUMBNAIL_WIDTH = 144;
const THUMBNAIL_HEIGHT = 81;

export function saveToGist(data, successCallback, errorCallback) {
  const { sceneName, description, isPublic } = data;
  let { filename } = data;

  // Append ".yaml" to the end of a filename if it does not
  // end with either ".yaml" or ".yml". GitHub Gist needs this
  // extension to properly detect the MIME type. (As of this
  // writing, the Gist API POST payload does not allow you to
  // specify the MIME-type of a file.)
  if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
    filename += '.yaml';
  }

  // Package up the data we want to post to gist
  // The first step is to grab a screenshot from the map and
  // convert it to a thumbnail at a fixed dimension. This
  // makes file sizes and layout more predictable.
  getScreenshotData()
    .then(screenshot =>
      createThumbnail(screenshot.url, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, true, false))
    .then((thumbnail) => {
      const files = {};
      const cachedUserData = getCachedUserSignInData();
      const metadata = {
        name: sceneName,
        view: {
          // label: getLocationLabel(), // TODO: change now that search component is React
          label: '',
          lat: map.getCenter().lat,
          lng: map.getCenter().lng,
          zoom: map.getZoom(),
        },
        date: new Date().toJSON(),
        versions: {
          tangram: window.Tangram.version,
          leaflet: L.version,
        },
        user: cachedUserData ? cachedUserData.nickname : null,
      };

      // This is a single YAML file
      // The key is its filename and it takes a content property
      // We cannot specify MIME type here so filename should have the
      // correct extension (see above)
      files[filename] = {
        content: getEditorContent(),
      };

      // GitHub Gist does not appear to have a limit on filesize,
      // but this thumbnail image should clock in at around ~90kb to ~120kb
      // (unoptimized, but that's the limitations of our thumbnail function)
      // We cannot store binary data over this API - this is stored as a data URL.
      files['thumbnail.png'] = {
        content: thumbnail,
      };

      // Store metadata
      files['.tangramplay'] = {
        content: JSON.stringify(metadata),
      };

      const postData = {
        description,
        public: isPublic,
        files,
      };

      // Make the post
      window.fetch('https://api.github.com/gists', {
        method: 'POST',
        // POSTing to /gists API requires a JSON blob of
        // MIME-type 'application/json'
        body: JSON.stringify(postData),
      }).then((response) => {
        switch (response.status) {
          case 201:
            return response.json();
          case 403:
            // eslint-disable-next-line max-len
            throw new Error('It looks like somebody (probably not you) was asking GitHub’s servers to do too many things so we’re not allowed to ask them to save your scene right now. Try again a little later when things cool down a bit.');
          default:
            // eslint-disable-next-line max-len
            throw new Error(`We got a ${response.status} code back from GitHub’s servers and don’t know what to do about it. Sorry, it’s a programmer error!`);
        }
      }).then((gist) => {
        successCallback({
          metadata,
          gist,
          thumbnail,
        });
      }).catch((error) => {
        errorCallback(error);
      });
    });
}
