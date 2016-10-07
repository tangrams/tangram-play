import React from 'react';
import ReactDOM from 'react-dom';
import localforage from 'localforage';

// Core elements
import { tangramLayer } from './map/map';
import { editor } from './editor/editor';

// Addons
import { showSceneLoadingIndicator, hideSceneLoadingIndicator } from './map/MapLoading';
import { initWidgetMarks } from './widgets/widgets-manager';
import { initErrorsManager } from './editor/errors';
import { initSuggestions } from './editor/suggest';
import { initGlslPickers } from './components/glsl-pickers/glsl-pickers';
import ErrorModal from './modals/ErrorModal';

// Import Utils
import { prependProtocolToUrl, getFilenameFromUrl } from './tools/helpers';
import { getQueryStringObject, pushHistoryState } from './tools/url-state';
import { isGistURL, getSceneURLFromGistAPI } from './tools/gist-url';
import EventEmitter from './components/event-emitter';

// Redux
import store from './store';
import { APP_INITIALIZED, SET_APP_STATE, OPEN_SCENE } from './store/actions';

const DEFAULT_SCENE = 'data/scenes/default.yaml';
const STORAGE_LAST_EDITOR_STATE = 'last-scene';

let initialScene = ''; // Stores initial scene file for embedded play.

function setSceneContentsInEditor(scene) {
    // Set new scene information in Redux store
    store.dispatch({
        type: OPEN_SCENE,
        ...scene,
    });
}

// `scene` is the state object matching the Redux state signature.
function doLoadProcess(scene) {
    // Store our intial scene for use within embedded Tangram Play
    initialScene = scene;

    setSceneContentsInEditor(scene);

    // Update history
    // Don't push a new history state if we are loading a scene from the
    // initial load of Tangram Play.
    if (store.getState().app.initialized === true) {
        pushHistoryState({
            scene: (scene.originalUrl) ? scene.originalUrl : null,
        });
    } else {
        // Okay, we are initialized now.
        store.dispatch({ type: APP_INITIALIZED });
    }

    // Reset map-not-loaded state
    store.dispatch({
        type: SET_APP_STATE,
        mapNotLoaded: false,
    });

    // Trigger Events
    // Event object is empty right now.
    EventEmitter.dispatch('tangram:sceneload', {});

    // Return the Promise from Tangram initializing
    return tangramLayer.scene.initializing;
}

function onLoadError(error) {
    ReactDOM.render(
        <ErrorModal error={error.message} />,
        document.getElementById('modal-container')
    );
    hideSceneLoadingIndicator();

    // TODO: editor should not be attached to this
    if (!store.getState().app.initialized) {
        store.dispatch({
            type: SET_APP_STATE,
            mapNotLoaded: true,
        });
        editor.doc.markClean();
    }
}

/**
 * Process a url path.
 * We need to be able to read a single YAML file as the root scene file.
 * User input can be all over the place, so this function takes input and
 * does processing to return a URL that is (hopefully) valid. Users may also
 * pass in a Gist URL string that looks like anything, but is not the root YAML
 * file. This contacts the Gist API to figure this out, so returns asynchronously.
 *
 * @param {string} url - the input url string
 * @returns {Promise} A promise which resolves to the final URL value.
 */
function processUrl(url) {
    let sceneUrl = url;

    // Provide protocol if it appears to be protocol-less URL
    sceneUrl = prependProtocolToUrl(sceneUrl);

    // Detect if URL is a Gist URL and obtain the root YAML scene file
    // This is an asynchronous response that returns Promises.
    if (isGistURL(sceneUrl) === true) {
        return getSceneURLFromGistAPI(sceneUrl);
    }

    // If not a Gist URL, wrap the return value in a Promise for consistent
    // return values.
    return new Promise(resolve => {
        resolve(sceneUrl);
    });
}

/**
 * Given an input URL, processes it, fetches its content, and constructs a
 * valid scene state object that is loaded into the editor.
 *
 * @param {string} url - the input url string
 * @returns {Promise} a Promise resolved with the scene state object.
 */
function makeSceneStateObjectFromUrl(url) {
    const sceneState = {};

    return processUrl(url)
        .then(sceneUrl => {
            sceneState.originalUrl = sceneUrl;
            sceneState.files = [{
                filename: getFilenameFromUrl(sceneUrl),
            }];
            return window.fetch(sceneUrl);
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('The scene you requested could not be found.');
                } else {
                    throw new Error('Something went wrong loading the scene!');
                }
            }

            return response.text();
        })
        .then(contents => {
            sceneState.files[0].contents = contents;
            return sceneState;
        });
}

/**
 * Determine what is the scene url and content to load during start-up.
 * It does it in this order:
 *  1) Is there something specified in the query string?
 *  2) Is there something in local memory? (via localforage)
 *  3) If neither of above, load the default scene file.
 *
 * Reading a remote URL or local memory is asynchronous, so this returns a Promise.
 *
 * @returns {Promise} - resolves to an object of scene data.
 */
function determineScene() {
    // If there is a query, use it
    const query = getQueryStringObject();

    if (query.scene) {
        return makeSceneStateObjectFromUrl(query.scene)
            .then(sceneState => {
                sceneState.files[0].highlightedLines = query.lines; // eslint-disable-line no-param-reassign
                return doLoadProcess(sceneState);
            });
    }

    // Else if there is something saved in memory (localforage), return that.
    // To be valid, it must contain at least one file.
    return localforage.getItem(STORAGE_LAST_EDITOR_STATE)
        .then(sceneState => {
            if (sceneState && sceneState.files && sceneState.files.length > 0) {
                return doLoadProcess(sceneState);
            }

            // Else load the default scene file.
            return makeSceneStateObjectFromUrl(DEFAULT_SCENE)
                .then(doLoadProcess);
        });
}

/**
 * This function is the canonical way to load a scene in Tangram Play.
 * We want to avoid loading scene files directly into either Tangram
 * or in CodeMirror and then having to update other parts of Tangram Play.
 * Instead, we load new scenes here so that all the different parts
 * of the application can be updated predictably. The load function takes
 * either a URL path (for remote / external scenes), or the contents
 * of a Tangram YAML file itself.
 *
 * @param {Object} scene - an object containing one of two properties:
 *      scene.url - a URL path to load a scene from
 *      scene.contents - Tangram YAML as a text blob
 *      Do not pass in both! Currently `url` takes priority, but
 *      this is not guaranteed behaviour.
 * @returns {Promise} A promise which is resolved when a scene's
 *      contents has been fetched.
 */
export function load(scene) {
    EventEmitter.dispatch('tangram:clear-palette', {});

    // Turn on loading indicator. This is turned off later
    // when Tangram reports that it's done.
    showSceneLoadingIndicator();

    // Either we are passed a url path, or scene file contents
    if (scene.url) {
        return makeSceneStateObjectFromUrl(scene.url)
            .then(doLoadProcess)
            .catch(onLoadError);
    } else if (scene.contents) {
        // If scene contents are provided, no asynchronous work is
        // performed here, but wrap this response in a Promise anyway
        // so that the return object is always a thenable.
        return new Promise(resolve => {
            // Make a scene object from the contents
            // TODO: add more data to this.
            const sceneState = {
                files: [{
                    contents: scene.contents,
                }],
            };
            doLoadProcess(sceneState);
            resolve();
        })
        .catch(onLoadError);
    }

    // if neither `scene.url` or `scene.contents` is provided, throw an error
    throw new Error('no scene url or contents provided');
}

export function initTangramPlay() {
    // TODO: Manage history / routing in its own module
    window.onpopstate = (e) => {
        if (e.state && e.state.scene) {
            load({ url: e.state.scene });
        }
    };

    showSceneLoadingIndicator();

    // LOAD SCENE FILE
    determineScene()
        // Things we do after Tangram is finished initializing
        .then(() => {
            // Initialize addons after Tangram is done, because
            // some addons depend on Tangram scene config being present
            // TODO: Verify if this is still true?
            if (window.isEmbedded === undefined) {
                // Add widgets marks and errors manager.
                initWidgetMarks();
                initErrorsManager();

                initSuggestions();
                initGlslPickers();
            }

            // Need to send a signal to the dropdown widgets of type source to populate
            EventEmitter.dispatch('tangram:sceneinit', {});
        })
        .catch(onLoadError);
}

// This function is only used by the embedded version of Tangram Play.
// We need it in order to refresh the original scene file if user makes any changes in the editor
export function reloadOriginalScene() {
    setSceneContentsInEditor(initialScene);
}
