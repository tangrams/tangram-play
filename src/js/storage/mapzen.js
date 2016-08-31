import { getEditorContent } from '../editor/editor';
import { map } from '../map/map';
import { getScreenshotData } from '../map/screenshot';
// import { getLocationLabel } from '../map/search'; // TODO: implement now that move to react has changed this
import { createThumbnail } from '../tools/thumbnail';

import { find } from 'lodash';
import L from 'leaflet';

const METADATA_DIR = '.tangramplay/';
const METADATA_FILEPATH = METADATA_DIR + 'metadata.json';
const THUMBNAIL_WIDTH = 144;
const THUMBNAIL_HEIGHT = 81;
const THUMBNAIL_FILEPATH = METADATA_DIR + 'thumbnail.png';
const SCENELIST_FILEPATH = 'scenelist.json';

// We don't allow this to be customized (yet) and in the future you might
// have multiple scene files anyway, so we'll do that all at once when we figure
// it out.
const SCENE_FILENAME = 'scene.yaml';

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
    // Add timestamp to `data`
    data.timestamp = new Date().toJSON();

    // Get a scene directory by slugifying the scene name, add a trailing slash.
    const slug = slugify(data.name) + '/';

    // These are Promises. Each creates its own contents and makes
    // individual upload requests. We resolve this function when all Promises
    // resolve.
    const uploadThumbnail = makeAndUploadThumbnail(slug);
    const uploadMetadata = makeAndUploadMetadata(data, slug);
    const uploadScene = makeAndUploadScene(data, slug);

    return Promise.all([uploadThumbnail, uploadMetadata, uploadScene])
        .then((savedLocations) => {
            // Should all be urls of the saved files.
            // Returns some an object containing metadata for the success handler
            // Errors should be handled upstream as well
            return downloadAndUpdateSceneList(data, savedLocations);
        });
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
    let uploadedFileUrl;

    return window.fetch(`/api/uploads/new?app=${APP_NAME}&path=${filepath}`, {
        credentials: 'same-origin'
    }).then((response) => {
        return response.json();
    }).then((upload) => {
        const formData = new FormData();
        Object.keys(upload.fields).forEach(field => {
            formData.append(field, upload.fields[field]);
        });

        const blob = new Blob([contents], { type: type });
        formData.append('file', blob, filepath);

        // Remember the location of the file we want to save.
        uploadedFileUrl = upload.url + upload.path;

        return window.fetch(upload.url, {
            method: 'POST',
            body: formData
        });
    }).then((response) => {
        // If uploaded, return the url of the uploaded file.
        if (response.ok) {
            return uploadedFileUrl;
        }
        else {
            // Caller should catch this error.
            // For now it just passes the status code.
            throw new Error(response.status);
        }
    });
}

/**
 * Creates and uploads a thumbnail image of the current map scene.
 *
 * @params {string} slug - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadThumbnail (slug) {
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
            return uploadFile(thumbnail, slug + THUMBNAIL_FILEPATH, 'image/png');
        });
}

/**
 * Creates and uploads metadata information about the current scene.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @params {string} slug - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadMetadata (data, slug) {
    // Add some additional view information to the metadata.
    const metadata = Object.assign({}, data, {
        slug: slug,
        view: {
            // label: getLocationLabel(), // TODO: change now that search component is React
            label: '',
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            zoom: map.getZoom()
        },
        versions: {
            tangram: window.Tangram.version,
            leaflet: L.version
        },
    });

    // Store metadata
    return uploadFile(JSON.stringify(metadata), slug + METADATA_FILEPATH, 'application/json');
}

/**
 * Creates and uploads the current scene file. We assume one editor document
 * and one scene file.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @params {string} slug - slugified scene name to use as scene directory
 * @returns {Promise} - fulfilled with the response of the POST request.
 */
function makeAndUploadScene (data, slug) {
    // This is a single YAML file for now
    const content = getEditorContent();

    // Store metadata
    return uploadFile(content, slug + SCENE_FILENAME, 'application/x-yaml');
}

/**
 * Downloads the scene list (or creates a new one if not already present) and
 * appends saved scene data to it.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @params {Array} savedLocations - array of saved files. This is created by
 *          Promise.all() and values should be in order:
 *          - savedLocations[0] - thumbnail.png
 *          - savedLocations[1] - metadata.json
 *          - savedLocations[2] - scene.yaml
 * @returns {Promise} - fulfilled with the object of scene data saved to
 *          `scenelist.json`
 */
function downloadAndUpdateSceneList (data, savedLocations) {
    const sceneData = Object.assign({}, data, {
        files: {
            thumbnail: savedLocations[0],
            metadata: savedLocations[1],
            scene: savedLocations[2]
        }
    });

    // The resolved value `sceneList` of `fetchSceneList` is current
    // scenelist.json contents or an empty array if it doesn't exist yet.
    return fetchSceneList()
        .then((sceneList) => {
            let foundExistingName = false;

            // If the scene exists already, overwrite its position in the list
            for (let i = 0; i < sceneList.length; i++) {
                if (sceneList[i].name === sceneData.name) {
                    sceneList[i] = sceneData;
                    foundExistingName = true;
                    break;
                }
            }
            // If not found, push to the end of array
            if (foundExistingName === false) {
                sceneList.push(sceneData);
            }

            return uploadFile(JSON.stringify(sceneList), SCENELIST_FILEPATH, 'application/json');
        })
        .then((sceneListUrl) => {
            return sceneData;
        });
}

/**
 * Fetches `scenelist.json` from the user account. Returns a Promise, resolved
 * with its contents in the form of an Array, or an empty Array if the file is
 * not found.
 *
 * @returns {Promise} - resolved with an array of saved scene data (or empty
 *          array if nothing is saved yet)
 */
export function fetchSceneList () {
    const fetchOpts = {
        credentials: 'same-origin'
    };

    // Checks the uploads object at `/api/uploads?app=play` to see if we have an
    // existing `scenelist.json`. This is so that we can make the check without
    // causing a 404 if it doesn't exist.
    return window.fetch('/api/uploads?app=play', fetchOpts)
        .then((response) => {
            return response.json();
        })
        .then((uploadsObj) => {
            return find(uploadsObj.uploads, (url) => {
                // TODO: Don't hardcode this URL!!
                return url.match(/https:\/\/mapzen-uploads.s3.amazonaws.com\/play\/[a-z0-9-]+\/scenelist.json/);
            });
        })
        .then((sceneListFile) => {
            // `sceneListFile` is a url
            if (sceneListFile) {
                return window.fetch(sceneListFile, fetchOpts)
                    .then((response) => {
                        return response.json();
                    });
            }
            // If not found, `sceneListFile` is null.
            // Create a new one of these
            else {
                return [];
            }
        });
}
