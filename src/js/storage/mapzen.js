import { getEditorContent } from '../editor/editor';
import { map } from '../map/map';
import { getScreenshotData } from '../map/screenshot';
// import { getLocationLabel } from '../map/search'; // TODO: implement now that move to react has changed this
import { createThumbnail } from '../tools/thumbnail';
import { getCachedUserSignInData } from '../user/sign-in';

import L from 'leaflet';

const METADATA_DIR = '.tangramplay/';
const METADATA_FILEPATH = METADATA_DIR + 'metadata.json';
const THUMBNAIL_WIDTH = 144;
const THUMBNAIL_HEIGHT = 81;
const THUMBNAIL_FILEPATH = METADATA_DIR + 'thumbnail.png';

/*
    Store files like this:
        ./scene-name-slug/scene.yaml
        ./scene-name-slug/[etc]
        ./scene-name-slug/.tangramplay/metadata.json
        ./scene-name-slug/.tangramplay/thumbnail.png

    Meta files are kept separate from scene related files but in a
    .tangramplay directory in the scene directory's root. This is to keep
    url schemes simple for the end user and namespace Play-related
    files. Think .git or similar.

    Scene files may eventually contain any quantity of files.
    (e.g. textures, multiple yamls, fonts, etc)

    Tangram Play only has two scene-related meta files now, a json
    for random strings and a thumbnail image.

    Eventually Tangram Play per-user settings may be stored in the root
*/

export function saveToMapzenUserAccount (data, successCallback, errorCallback) {
    const { sceneName } = data;

    // Get a scene directory by slugifying the scene name, add a trailing slash.
    const sceneDir = slugify(sceneName) + '/';

    // These are Promises. Each creates its own contents and makes
    // individual upload requests. We resolve this function when all Promises
    // resolve.
    const uploadThumbnail = makeAndUploadThumbnail(sceneDir);
    const uploadMetadata = makeAndUploadMetadata(data, sceneDir);
    const uploadScene = makeAndUploadScene(data, sceneDir);

    return Promise.all([uploadThumbnail, uploadMetadata, uploadScene])
        .then((responses) => {
            console.log(responses);
            // Should all be responses[x].ok

            // Return some useful data for the success handler
        });

    //     // Make the post
    //     window.fetch('https://api.github.com/gists', {
    //         method: 'POST',
    //         // POSTing to /gists API requires a JSON blob of
    //         // MIME-type 'application/json'
    //         body: JSON.stringify(data)
    //     }).then(response => {
    //         switch (response.status) {
    //             case 201:
    //                 return response.json();
    //             case 403:
    //                 throw new Error('It looks like somebody (probably not you) was asking GitHub’s servers to do too many things so we’re not allowed to ask them to save your scene right now. Try again a little later when things cool down a bit.');
    //             default:
    //                 throw new Error(`We got a ${response.status} code back from GitHub’s servers and don’t know what to do about it. Sorry, it’s a programmer error!`);
    //         }
    //     }).then((gist) => {
    //         successCallback({
    //             metadata: metadata,
    //             gist: gist,
    //             thumbnail: thumbnail
    //         });
    //     }).catch((error) => {
    //         console.error(error);
    //         errorCallback(error);
    //     });
    // });
}

// super quickly written slugify function. only replaces whitespace with dashes.
// does not deal with funky characters. or condense spaces, all that stuff.
// should also eventually enforce a maximum length. or handle errors.
function slugify (string) {
    return string.trim().toLowerCase().replace(/\s/g, '-');
}

/**
 * Upload a file using the Mapzen upload API.
 *
 * @param {*} contents - content of the file to upload. This will be converted
 *      to a Blob object by this function.
 * @param {string} filepath - file path and file name to save to, relative
 *      to the app data directory. e.g. 'scene-name/scene.yaml'
 * @param {string} type - MIME type of contents. Defaults to 'plain/text'.
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function uploadFile (contents, filepath, type = 'plain/text') {
    const APP_NAME = 'play';

    return window.fetch(`/api/uploads/new?app=${APP_NAME}&path=${filepath}`, {
        credentials: 'same-origin'
    }).then((response) => {
        return response.json();
    }).then((upload) => {
        var formData = new FormData();
        Object.keys(upload.fields).forEach(field => {
            formData.append(field, upload.fields[field]);
        });

        var blob = new Blob([contents], { type: type });
        formData.append('file', blob, filepath);

        return window.fetch(upload.url, {
            method: 'POST',
            body: formData
        });
    }).catch((error) => {
        console.error('there is an error:', error);
    });
}

/**
 * Creates and uploads a thumbnail image of the current map scene.
 *
 * @params {string} sceneDir - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadThumbnail (sceneDir) {
    // Grab a screenshot from the map and convert it to a thumbnail at a fixed
    // dimension. This makes file sizes and layout more predictable.
    return getScreenshotData()
        .then((screenshot) => {
            // At this size, thumbnail image should clock in at around ~90kb
            // to ~120kb (unoptimized, but that's the limitations of our
            // thumbnail function)
            return createThumbnail(screenshot.blob, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        })
        .then((thumbnail) => {
            // Make upload request
            return uploadFile(thumbnail, sceneDir + THUMBNAIL_FILEPATH, 'image/png');
        });
}

/**
 * Creates and uploads metadata information about the current scene.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @params {string} sceneDir - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadMetadata (data, sceneDir) {
    const { sceneName, description, isPublic } = data;
    const cachedUserData = getCachedUserSignInData();
    const metadata = {
        name: sceneName,
        description: description,
        isPublic: isPublic,
        view: {
            // label: getLocationLabel(), // TODO: change now that search component is React
            label: '',
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            zoom: map.getZoom()
        },
        date: new Date().toJSON(),
        versions: {
            tangram: window.Tangram.version,
            leaflet: L.version
        },
        user: cachedUserData ? cachedUserData.nickname : null
    };

    // Store metadata
    return uploadFile(JSON.stringify(metadata), sceneDir + METADATA_FILEPATH, 'application/json');
}

/**
 * Creates and uploads the current scene file.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @params {string} sceneDir - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadScene (data, sceneDir) {
    let { filename } = data;

    // Append ".yaml" to the end of a filename if it does not
    // end with either ".yaml" or ".yml". We will also specify MIME type later.
    if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
        filename += '.yaml';
    }

    // This is a single YAML file
    const content = getEditorContent();

    // Store metadata
    return uploadFile(content, sceneDir + filename, 'application/x-yaml');
}
