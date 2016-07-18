// Polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

// Error tracking
// Load this before all other modules. Only load when run in production.
import Raven from 'raven-js';
if (window.location.hostname === 'mapzen.com' || window.location.hostname === 'www.mapzen.com') {
    Raven.config('https://728949999d2a438ab006fed5829fb9c5@app.getsentry.com/78467', {
        whitelistUrls: [/mapzen\.com/, /www\.mapzen\.com/]
    }).install();
}

// Core elements
import { tangramLayer, initMap, loadScene } from './map/map';
import { editor, getEditorContent, setEditorContent, getNodesOfLine } from './editor/editor';

// Addons
import { showSceneLoadingIndicator, hideSceneLoadingIndicator } from './map/loading';
import { initWidgetMarks } from './widgets/widgets-manager';
import ErrorModal from './modals/modal.error';
import SuggestManager from './editor/suggest';
import ErrorsManager from './editor/errors';
// import GlslSandbox from './glsl/sandbox';
import GlslWidgetsLink from './components/widgets-link/glsl-widgets-link';
import LocalStorage from './storage/localstorage';

// Import Utils
import { subscribeMixin } from './tools/mixin';
import { getQueryStringObject, serializeToQueryString, prependProtocolToUrl } from './tools/helpers';
import { isGistURL, getSceneURLFromGistAPI } from './tools/gist-url';
import { debounce, createObjectURL } from './tools/common';
import { parseYamlString } from './editor/codemirror/yaml-tangram';
import { highlightRanges, updateLinesQueryString } from './editor/highlight';

// Import UI elements
import { initDivider } from './ui/divider';
import { EventEmitter } from './components/event-emitter';

const query = getQueryStringObject();

const DEFAULT_SCENE = 'data/scenes/default.yaml';
const STORAGE_LAST_EDITOR_CONTENT = 'last-content';

let initialLoad = true;

class TangramPlay {
    constructor () {
        subscribeMixin(this);

        initMap();
        this.addons = {};

        // Wrap this.updateContent() in a debounce function
        this.updateContent = debounce(this.updateContent, 500);

        // Bind callback function to correct context
        this._watchEditorForChanges = this._watchEditorForChanges.bind(this);

        // TODO: Manage history / routing in its own module
        window.onpopstate = (e) => {
            if (e.state && e.state.sceneUrl) {
                this.load({ url: e.state.sceneUrl });
            }
        };

        // LOAD SCENE FILE
        const initialScene = determineScene();
        this.load(initialScene)
            .then(() => {
                // Highlight lines if requested by the query string.
                let lines = query.lines;
                if (lines) {
                    highlightRanges(lines);
                    updateLinesQueryString();
                }

                // Add widgets marks.
                initWidgetMarks();

                // Things we do after Tangram is finished initializing
                tangramLayer.scene.initializing.then(() => {
                    this.trigger('sceneinit');
                    // Need to send a signal to the dropdown widgets of type source to populate
                    EventEmitter.dispatch('tangram:sceneinit', {});

                    // Initialize addons after Tangram is done, because
                    // some addons depend on Tangram scene config being present
                    this.initAddons();
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

    //  ADDONS
    initAddons () {
        this.addons.suggestManager = new SuggestManager();
        // this.addons.glslSandbox = new GlslSandbox();
        this.addons.glslHelpers = new GlslWidgetsLink();
        this.addons.errorsManager = new ErrorsManager();
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
    load (scene) {
        // Turn on loading indicator. This is turned off later
        // when Tangram reports that it's done.
        showSceneLoadingIndicator();

        // Turn off watching for changes in editor.
        editor.off('changes', this._watchEditorForChanges);

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
                this._doLoadProcess({ url: scene.url, contents });
            })
            .catch(error => {
                this._onLoadError(error);
            });
        }
        else if (scene.contents) {
            // If scene contents are provided, no asynchronous work is
            // performed here, but wrap this response in a Promise anyway
            // so that the return object is always a thenable.
            return new Promise((resolve, reject) => {
                this._doLoadProcess(scene);
                resolve();
            });
        }
    }

    _onLoadError (error) {
        const errorModal = new ErrorModal(error.message);
        errorModal.show();
        hideSceneLoadingIndicator();

        // TODO: editor should not be attached to this
        if (initialLoad === true) {
            showUnloadedState(editor);
            editor.doc.markClean();
        }
    }

    _doLoadProcess (scene) {
        let url = scene.url || createObjectURL(scene.contents);

        // Send url to map and contents to editor
        // TODO: get contents from Tangram instead of another xhr request.
        loadScene(url, {
            reset: true,
            basePath: scene['original_base_path']
        });
        this._setSceneContentsInEditor(scene);

        hideUnloadedState();

        // This should only be true once
        initialLoad = false;

        // Update history
        // Can't do a pushstate where the URL includes 'http://localhost' due to security
        // problems. So we have to let the browser do the routing relative to the server
        const locationPrefix = window.location.pathname;
        const queryObj = {};
        if (scene.url) {
            queryObj.scene = scene.url;
        }
        const queryString = serializeToQueryString(queryObj);

        window.history.pushState({
            sceneUrl: (scene.url) ? scene.url : null
        }, null, locationPrefix + queryString + window.location.hash);

        // Trigger Events
        // Event object is empty right now.
        this.trigger('sceneload', {});
    }

    // Update widgets & content after a batch of changes
    _watchEditorForChanges (cm, changes) {
        this.updateContent();
    }

    _setSceneContentsInEditor (sceneData) {
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
        editor.on('changes', this._watchEditorForChanges);
    }

    // If editor is updated, send it to the map.
    updateContent () {
        const content = getEditorContent();
        const url = createObjectURL(content);

        // Send scene data to Tangram
        loadScene(url);

        // Update the page URL. For editor changes in particular,
        // the ?scene=parameter should be erased. This prevents
        // reloading (or copy-pasting the URL) from directing to
        // the wrong scene.
        const queryObj = getQueryStringObject();
        if (queryObj.scene) {
            delete queryObj.scene;
            const url = window.location.pathname;
            const queryString = serializeToQueryString(queryObj);
            window.history.replaceState({}, null, url + queryString + window.location.hash);
        }
    }

    getNodesForAddress (address) {
        // NOTE:
        // This is an expensive process because for each call need to iterate through each line until it founds the right
        // address. Could be optimize if we store addresses in a map... but then the question is about how to keep it sync
        //
        let lastState;
        for (let line = 0, size = editor.getDoc().size; line < size; line++) {
            const lineHandle = editor.getLineHandle(line);

            if (!lineHandle.stateAfter) {
                // If the line is NOT parsed.
                // ======================================================
                //
                // NOTE:
                // Manually parse it in a temporal buffer to avoid conflicts with codemirror parser.
                // This means outside the Line Handle
                //
                // Copy the last parsed state
                var state = JSON.parse(JSON.stringify(lastState));
                state.line = line;

                // Parse the current state
                state = parseYamlString(lineHandle.text, state, 4);

                // Iterate through keys in this line
                for (let key of state.nodes) {
                    if (key.address === address) {
                        return key;
                    }
                }
                // if nothing was found. Record the state and try again
                lastState = state;
                // TODO:
                // We might want to have two different parsers, a simpler one without keys and just address for
                // the higliting and another more roboust that keep tracks of: pairs (key/values), their ranges (from-to positions),
                // address and a some functions like getValue, setValue which could be use by widgets or others addons to modify content
            }
            else {
                // it the line HAVE BEEN parsed (use the stateAfter)
                // ======================================================
                lastState = lineHandle.stateAfter;
                let keys = getNodesOfLine(line);
                for (let key of keys) {
                    if (key.address === address) {
                        return key;
                    }
                }
            }
        }
        console.log('Fail searching', address);
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

let tangramPlay = new TangramPlay();

export default tangramPlay;

// This is called here because right now divider position relies on
// editor and map being set up already
initDivider();

// for debug
window.tangramPlay = tangramPlay;

/* ********************************* REACT ********************************* */

var React = require('react');
var ReactDOM = require('react-dom');

import MenuBar from './components/menu-bar.react';
import MapPanel from './components/map-panel.react';
import ColorPalette from './components/color-palette.react';
import FileDrop from './file/drop';

let mountNode1 = document.getElementById('menu-bar');
ReactDOM.render(<MenuBar />, mountNode1);

let mountNode2 = document.getElementById('map-panel');
ReactDOM.render(<MapPanel />, mountNode2);

let mountNode3 = document.getElementsByClassName('colorpalette');
ReactDOM.render(<ColorPalette />, mountNode3[0]);

let mountNode4 = document.getElementById('filedrop');
ReactDOM.render(<FileDrop />, mountNode4);
