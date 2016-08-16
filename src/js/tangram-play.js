// Polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

// Error tracking
// Load this before all other modules. Only load when run in production.
// Requires `loose-envify` package in build process to set the correct `NODE_ENV`.
import Raven from 'raven-js';
if (process.env.NODE_ENV === 'production') {
    Raven.config('https://728949999d2a438ab006fed5829fb9c5@app.getsentry.com/78467', {
        whitelistUrls: [/mapzen\.com/, /www\.mapzen\.com/],
        environment: process.env.NODE_ENV
    }).install();
}

// Core elements
import { tangramLayer, initMap, loadScene } from './map/map';
import { editor, getEditorContent, setEditorContent } from './editor/editor';

// Addons
import { showSceneLoadingIndicator, hideSceneLoadingIndicator } from './map/loading';
import { initWidgetMarks } from './widgets/widgets-manager';
import { initErrorsManager } from './editor/errors';
import { initSuggestions } from './editor/suggest';
import { initGlslWidgetsLink } from './components/widgets-link/glsl-widgets-link';
import ErrorModal from './modals/ErrorModal';
import LocalStorage from './storage/localstorage';

// Import Utils
import debounce from 'lodash/debounce';
import { prependProtocolToUrl } from './tools/helpers';
import { getQueryStringObject, pushHistoryState, replaceHistoryState } from './tools/url-state';
import { isGistURL, getSceneURLFromGistAPI } from './tools/gist-url';
import { createObjectURL } from './tools/common';
import { initHighlight, highlightRanges } from './editor/highlight';
import { EventEmitter } from './components/event-emitter';

// Import UI elements
import { initDivider } from './ui/divider';

const DEFAULT_SCENE = 'data/scenes/default.yaml';
const STORAGE_LAST_EDITOR_CONTENT = 'last-content';

let initialLoad = true;

function initTangramPlay () {
    initMap();

    // TODO: Manage history / routing in its own module
    window.onpopstate = (e) => {
        if (e.state && e.state.scene) {
            load({ url: e.state.scene });
        }
    };

    // LOAD SCENE FILE
    const initialScene = determineScene();
    load(initialScene)
        .then(() => {
            // Highlight lines if requested by the query string.
            const query = getQueryStringObject();
            if (query.lines) {
                highlightRanges(query.lines);
            }

            // Turn on highlighting module
            initHighlight();

            // Add widgets marks and errors manager.
            initWidgetMarks();
            initErrorsManager();

            // Things we do after Tangram is finished initializing
            tangramLayer.scene.initializing.then(() => {
                // Need to send a signal to the dropdown widgets of type source to populate
                EventEmitter.dispatch('tangram:sceneinit', {});

                // Initialize addons after Tangram is done, because
                // some addons depend on Tangram scene config being present
                // TODO: Verify if this is still true?
                initSuggestions();
                initGlslWidgetsLink();
            });
        });

    // If the user bails for whatever reason, hastily shove the contents of
    // the editor into some kind of storage. This overwrites whatever was
    // there before. Note that there is not really a way of handling unload
    // with our own UI and logic, since this allows for widespread abuse
    // of normal browser functionality.
    window.addEventListener('beforeunload', (event) => {
        // TODO:
        // Don't take original url or original base path from
        // Tangram (it may be wrong). Instead, remember this
        // in a "session" variable
        /* eslint-disable camelcase */
        const doc = editor.getDoc();
        const sceneData = {
            original_url: tangramLayer.scene.config_source,
            original_base_path: tangramLayer.scene.config_path,
            contents: getEditorContent(),
            is_clean: doc.isClean(),
            scrollInfo: editor.getScrollInfo(),
            cursor: doc.getCursor()
        };
        /* eslint-enable camelcase */

        saveSceneContentsToLocalMemory(sceneData);
    });
}

// Update widgets & content after a batch of changes
// Wrap updateContent() in a debounce function
const _watchEditorForChanges = debounce(updateContent, 500);

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
export function load (scene) {
    EventEmitter.dispatch('tangram:clear-palette', {});

    // Turn on loading indicator. This is turned off later
    // when Tangram reports that it's done.
    showSceneLoadingIndicator();

    // Turn off watching for changes in editor.
    editor.off('changes', _watchEditorForChanges);

    // Either we are passed a url path, or scene file contents
    if (scene.url) {
        let fetchPromise;

        // Provide protocol if it appears to be protocol-less URL
        scene.url = prependProtocolToUrl(scene.url);

        // If it appears to be a Gist URL:
        if (isGistURL(scene.url) === true) {
            fetchPromise = getSceneURLFromGistAPI(scene.url)
                .then(url => {
                    // Update the scene URL property with the correct URL
                    // to the raw YAML to ensure safe loading
                    scene.url = url;
                    return window.fetch(url);
                });
        }
        // Fetch the contents of a YAML file directly. This step
        // allows us to verify contents (TODO) or error status.
        else {
            fetchPromise = window.fetch(scene.url);
        }

        return fetchPromise.then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('The scene you requested could not be found.');
                }
                else {
                    throw new Error('Something went wrong loading the scene!');
                }
            }

            return response.text();
        })
        .then(contents => {
            _doLoadProcess({ url: scene.url, contents });
        })
        .catch(error => {
            _onLoadError(error);
        });
    }
    else if (scene.contents) {
        // If scene contents are provided, no asynchronous work is
        // performed here, but wrap this response in a Promise anyway
        // so that the return object is always a thenable.
        return new Promise((resolve, reject) => {
            _doLoadProcess(scene);
            resolve();
        });
    }
}

function _onLoadError (error) {
    ReactDOM.render(<ErrorModal error={error.message} />, document.getElementById('modal-container'));
    hideSceneLoadingIndicator();

    // TODO: editor should not be attached to this
    if (initialLoad === true) {
        showUnloadedState(editor);
        editor.doc.markClean();
    }
}

function _doLoadProcess (scene) {
    let url = scene.url || createObjectURL(scene.contents);

    // Send url to map and contents to editor
    // TODO: get contents from Tangram instead of another xhr request.
    loadScene(url, {
        reset: true,
        basePath: scene['original_base_path']
    });
    _setSceneContentsInEditor(scene);

    hideUnloadedState();

    // Update history
    // Don't push a new history state if we are loading a scene from the
    // initial load of Tangram Play.
    if (initialLoad === false) {
        pushHistoryState({
            scene: (scene.url) ? scene.url : null
        });
    }

    // This should only be true once
    initialLoad = false;

    // Trigger Events
    // Event object is empty right now.
    EventEmitter.dispatch('tangram:sceneload', {});
}

function _setSceneContentsInEditor (sceneData) {
    // Mark as "clean" if the contents are freshly loaded
    // (there is no is_clean property defined) or if contents
    // have been restored with the is_clean property set to "true"
    // This is converted from JSON so the value is a string, not
    // a Boolean. Otherwise, the document has not been previously
    // saved and it is left in the "dirty" state.
    const shouldMarkClean = (typeof sceneData['is_clean'] === 'undefined' || sceneData['is_clean'] === 'true');

    setEditorContent(sceneData.contents, shouldMarkClean);

    // Restore cursor position, if provided.
    if (sceneData.cursor) {
        editor.doc.setCursor(sceneData.cursor, {
            scroll: false
        });
    }

    // Restores the part of the document that was scrolled to, if provided.
    if (sceneData.scrollInfo) {
        let left = sceneData.scrollInfo.left || 0;
        let top = sceneData.scrollInfo.top || 0;
        editor.scrollTo(left, top);
    }

    // Turn change watching back on.
    editor.on('changes', _watchEditorForChanges);
}

// If editor is updated, send it to the map.
function updateContent () {
    const content = getEditorContent();
    const url = createObjectURL(content);
    const isClean = editor.getDoc().isClean();

    // Send scene data to Tangram
    loadScene(url);

    // Update the page URL. When editor contents changes by user input
    // and the the editor state is not clean), we erase the ?scene= state
    // from the URL string. This prevents a situation where reloading (or
    // copy-pasting the URL) loads the scene file from an earlier state.
    if (!isClean) {
        replaceHistoryState({
            scene: null
        });
    }
}

function showUnloadedState (editor) {
    document.querySelector('.map-view').classList.add('map-view-not-loaded');
}

function hideUnloadedState () {
    document.querySelector('.map-view').classList.remove('map-view-not-loaded');
}

// Determine what is the scene url and content to load during start-up
function determineScene () {
    let scene = {};

    // If there is a query, return it
    let query = getQueryStringObject();
    if (query.scene) {
        scene.url = query.scene;
        return scene;
    }

    // Else if there is something saved in memory (LocalStorage), return that
    // Check that contents exist and that it is not empty.
    let sceneData = getSceneContentsFromLocalMemory();
    if (sceneData && sceneData.contents && sceneData.contents.trim().length > 0) {
        return sceneData;
    }

    // Else load the default scene file.
    scene.url = DEFAULT_SCENE;
    return scene;
}

function saveSceneContentsToLocalMemory (sceneData) {
    // Expects an object of format:
    // {
    //     original_url: 'http://valid.url/path/scene.yaml',
    //     original_base_path: 'http://valid.url/path/',
    //     contents: 'Contents of scene.yaml',
    //     is_clean: boolean value; false indicates original contents were modified without saving
    //     scrollInfo: editor's scroll position
    //     cursor: where the cursor was positioned in the document.
    // }
    LocalStorage.setItem(STORAGE_LAST_EDITOR_CONTENT, JSON.stringify(sceneData));
}

function getSceneContentsFromLocalMemory () {
    return JSON.parse(LocalStorage.getItem(STORAGE_LAST_EDITOR_CONTENT));
}

initTangramPlay();

// This is called here because right now divider position relies on
// editor and map being set up already
initDivider();

/* ********************************* REACT ********************************* */

var React = require('react');
var ReactDOM = require('react-dom');

import MenuBar from './components/MenuBar';
import MapPanel from './components/MapPanel';
import OverlaysContainer from './ui/OverlaysContainer';
// import ColorPalette from './components/ColorPalette';

let mountNode1 = document.getElementById('menu-bar');
ReactDOM.render(<MenuBar />, mountNode1);

let mountNode2 = document.getElementById('map-panel');
ReactDOM.render(<MapPanel />, mountNode2);

let mountNode3 = document.getElementById('overlays-container');
ReactDOM.render(<OverlaysContainer />, mountNode3);

// let mountNode4 = document.getElementsByClassName('colorpalette');
// ReactDOM.render(<ColorPalette />, mountNode4[0]);
