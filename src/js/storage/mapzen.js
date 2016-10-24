import L from 'leaflet';

import { getEditorContent } from '../editor/editor';
import { map } from '../map/map';
import { getScreenshotData } from '../map/screenshot';
// TODO: implement now that move to react has changed this
// import { getLocationLabel } from '../map/search';
import { createThumbnail } from '../tools/thumbnail';

import store from '../store';
import config from '../config';

const THUMBNAIL_WIDTH = 144;
const THUMBNAIL_HEIGHT = 81;

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

// We only need the user-id for the API (plus, I assume, cookie credentials).
// This is for retrieving just the user ID from Redux store. Maybe this goes
// elsewhere eventually.
function getUserId() {
    return store.getState().user.id;
}

// wrap fetch to make it work both locally and stuff
function makeMapzenAPIRequest(path, options = {}) {
    const apiPath = config.MAPZEN_API.SCENE_API_PATH;
    const mergeOptions = {
        ...options,
        credentials: 'same-origin',
    };

    let baseUrl;

    // use hostname to determine environment
    // (should we use process.env.NODE_ENV for this?)
    switch (window.location.hostname) {
        case 'localhost':
            baseUrl = config.MAPZEN_API.ORIGIN.DEVELOPMENT;
            mergeOptions.credentials = 'include';
            break;
        case 'dev.mapzen.com':
            baseUrl = config.MAPZEN_API.ORIGIN.STAGING;
            break;
        default:
            baseUrl = config.MAPZEN_API.ORIGIN.PRODUCTION;
    }

    // Return wrapped fetch. This also wraps the part that checks if response
    // is OK and throws an error or returns JSON.
    return window.fetch(`${baseUrl}${apiPath}${path}`, mergeOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status);
            }

            return response.json();
        });
}

/**
 * Create a thumbnail image of the current map scene as a Data-URI (which is
 * currently the format accepted by the Mapzen scene API).
 *
 * @returns {Promise} - fulfilled with the screenshot as a Data-URI.
 */
function makeThumbnail() {
    // Grab a screenshot from the map and convert it to a thumbnail at a fixed
    // dimension. This makes file sizes and layout more predictable.
    return getScreenshotData()
        // At this size, thumbnail image should clock in at around ~90kb
        // to ~120kb (unoptimized, but that's the limitations of our
        // thumbnail function)
        .then(screenshot => createThumbnail(screenshot.blob, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, true, false));
}

/**
 * Creates additional metadata information about the current scene.
 *
 * @params {Object} data - data passed to saveToMapzenUserAccount()
 * @returns {Object} metadata - additional metadata for the Scene API
 */
function addMetadata(data) {
    // Add some additional view information to the metadata.
    const metadata = Object.assign({}, data, {
        view: {
            // label: getLocationLabel(), // TODO: change now that search component is React
            label: '',
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            zoom: map.getZoom(),
        },
        versions: {
            tangram: window.Tangram.version,
            leaflet: L.version,
        },
    });

    return metadata;
}

/**
 * Retrieve scene list from Mapzen scene API. Returns a Promise, resolved with
 * its contents in the form of an Array. This array is empty if there are no
 * scenes saved.
 *
 * @returns {Promise} - resolved with an array of saved scene data (or empty
 *          array if nothing is saved yet)
 */
export function fetchSceneList() {
    const userId = getUserId();

    return makeMapzenAPIRequest(userId)
        .then(scenes => {
            // API gives an object with error property if an error occurred.
            if (scenes.error) {
                throw new Error(scenes.error);
            }

            // Returns with array of scenes (or empty array if no scenes).
            console.log(scenes);
            return scenes;
        });
}

export function saveToMapzenUserAccount(data) {
    const userId = getUserId();
    // TODO: add other data - here, or provided upstream?

    const metadata = addMetadata(data);

    // This is a single YAML file for now - whatever's in the current editor.
    // TODO: get only root scene file
    const content = getEditorContent();

    // POST a new scene.
    return makeThumbnail()
        .then(screenshotData => {
            // Add thumbnail as data-URI to payload
            metadata.thumbnail = screenshotData;
            console.log(metadata);

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata),
            };

            return makeMapzenAPIRequest(`${userId}`, requestOptions)
                .then(sceneData => {
                    // This data will contain the `id` and `resources_url` needed to
                    // POST each of our resources.
                    console.log(sceneData);

                    // temp: to deal with this not needing url concatenation
                    return window.fetch(sceneData.entrypoint_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/x-yaml' },
                        body: content,
                        credentials: 'include',
                    });
                });
        });
}
