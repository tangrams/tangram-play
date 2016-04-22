// Polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

// Core elements
import { tangram, initMap, loadScene } from './map/map';
import { initEditor } from './editor/editor';

// Addons
import { showSceneLoadingIndicator, hideSceneLoadingIndicator } from './map/loading';
import ErrorModal from './modals/modal.error';
import WidgetsManager from './widgets/widgets-manager';
import SuggestManager from './editor/suggest';
import ErrorsManager from './editor/errors';
// import GlslSandbox from './glsl/sandbox';
import GlslHelpers from './glsl/helpers';
import ColorPalette from './widgets/color-palette';
import LocalStorage from './storage/localstorage';

// Import Utils
import { subscribeMixin } from './tools/mixin';
import { getQueryStringObject, serializeToQueryString, prependProtocolToUrl } from './tools/helpers';
import { isGistURL, getSceneURLFromGistAPI } from './tools/gist-url';
import { debounce, createObjectURL } from './tools/common';
import { selectLines, isStrEmpty } from './editor/codemirror/tools';
import { getNodes, parseYamlString } from './editor/codemirror/yaml-tangram';
import { injectAPIKeys, suppressAPIKeys } from './editor/api-keys';

// Import UI elements
import { initDivider } from './ui/divider';
import './file/drop';
import './menus/menu';
import './ui/tooltip';

const query = getQueryStringObject();

const DEFAULT_SCENE = 'data/scenes/default.yaml';
const STORAGE_LAST_EDITOR_CONTENT = 'last-content';

let initialLoad = true;

class TangramPlay {
    constructor () {
        subscribeMixin(this);

        this.editor = initEditor('editor');
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

        setTimeout(() => {
            if (query['lines']) {
                this.selectLines(query['lines']);
            }
        }, 500);

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
            let sceneData = {
                original_url: tangram.scene.config_source,
                original_base_path: tangram.scene.config_path,
                contents: this.getContent(),
                is_clean: this.editor.isClean()
            };
            saveSceneContentsToLocalMemory(sceneData);
        });
    }

    //  ADDONS
    initAddons () {
        this.addons.widgetsManager = new WidgetsManager('data/tangram-api.json');
        this.addons.suggestManager = new SuggestManager('data/tangram-api.json');
        // this.addons.glslSandbox = new GlslSandbox();
        this.addons.glslHelpers = new GlslHelpers();
        this.addons.errorsManager = new ErrorsManager();
        this.addons.colorPalette = new ColorPalette();
    }

    /**
     * This function is the canonical way to load a scene in Tangram Play.
     * We want to avoid situations where we load scene files directly
     * into either Tangram or in CodeMirror and then have to handle
     * updating other parts of Tangram Play. Instead, we want Tangram Play
     * to ingest new scenes in a single way so that all the different parts
     * of the application can be updated predictably. The load function takes
     * either a URL path (for remote / external scenes), or the contents
     * of a Tangram YAML file itself.
     *
     * @param {Object} scene - an object containing one of two properties:
     *      scene.url - a URL path to load a scene from
     *      scene.contents - Tangram YAML as a text blob
     *      Do not pass in both! Currently `url` takes priority, but
     *      this is not guaranteed behaviour.
     */
    load (scene) {
        // Turn on loading indicator. This is turned off later
        // when Tangram reports that it's done.
        showSceneLoadingIndicator();

        // Turn off watching for changes in editor.
        this.editor.off('changes', this._watchEditorForChanges);

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

            fetchPromise.then(response => {
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
            this._doLoadProcess(scene);
        }
    }

    _onLoadError (error) {
        const errorModal = new ErrorModal(error.message);
        errorModal.show();
        hideSceneLoadingIndicator();

        // TODO: editor should not be attached to this
        if (initialLoad === true) {
            showUnloadedState(this.editor);
            this.editor.doc.markClean();
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
        let locationPrefix = window.location.pathname;
        if (scene.url) {
            locationPrefix += '?scene=' + scene.url;
        }

        window.history.pushState({
            sceneUrl: (scene.url) ? scene.url : null
        }, null, locationPrefix + window.location.hash);

        // Trigger Events
        // Event object is empty right now.
        this.trigger('sceneload', {});
    }

    // Update widgets & content after a batch of changes
    _watchEditorForChanges (cm, changes) {
        this.updateContent();
    }

    _setSceneContentsInEditor (sceneData) {
        // Remove any instances of Tangram Play's default API key
        let contents = suppressAPIKeys(sceneData.contents);

        // Set content in CodeMirror
        this.editor.setValue(contents);
        this.editor.clearHistory();

        // Mark as "clean" if the contents are freshly loaded
        // (there is no is_clean property defined) or if contents
        // have been restored with the is_clean property set to "true"
        // This is converted from JSON so the value is a string, not
        // a Boolean. Otherwise, the document has not been previously
        // saved and it is left in the "dirty" state.
        if (typeof sceneData['is_clean'] === 'undefined' || sceneData['is_clean'] === 'true') {
            this.editor.doc.markClean();
        }

        // Turn change watching back on.
        this.editor.on('changes', this._watchEditorForChanges);
    }

    // SET
    setValue (node, str) {
        // Force space between the ':' and the value
        if (node.value === '') {
            str = ' ' + str;
        }

        // Calculate begining character of the value
        //               key:_[anchor]value
        //               ^ ^^^^
        //               | ||||__ + anchor.length
        //               | |||___ + 1
        //               | | `--- + 1
        //  range.from.ch  key.lenght

        let from = { line: node.range.from.line,
                     ch: node.range.from.ch + node.anchor.length + node.key.length + 2 };

        this.editor.doc.replaceRange(str, from, node.range.to);
    }

    // If editor is updated, send it to the map.
    updateContent () {
        const content = this.getContent();
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

    // GET
    // Get the contents of the editor (with injected API keys)
    getContent () {
        let content = this.editor.getValue();
        //  If API keys are missing, inject one
        content = injectAPIKeys(content);
        return content;
    }

    getNodes (from, to) {
        let nodes = [];

        if (from.line === to.line) {
            // If the searched nodes are in a same line
            let line = from.line;
            let inLineNodes = this.getNodesOnLine(line);

            for (let node of inLineNodes) {
                if (node.range.to.ch > from.ch || node.range.from < to.ch) {
                    nodes.push(node);
                }
            }
        }
        else {
            // If the searched nodes are in a range of lines
            for (let i = from.line; i <= to.line; i++) {
                let inLineNodes = this.getNodesOnLine(i);

                for (let node of inLineNodes) {
                    if (node.range.from.line === from.line) {
                        // Is in the beginning line
                        if (node.range.to.ch > from.ch) {
                            nodes.push(node);
                        }
                    }
                    else if (node.range.to.line === to.line) {
                        // is in the end line
                        if (node.range.from.ch < to.ch) {
                            nodes.push(node);
                        }
                    }
                    else {
                        // is in the sandwich lines
                        nodes.push(node);
                    }
                }
            }
        }
        return nodes;
    }

    getNodesOnLine (nLine) {
        if (isStrEmpty(this.editor.getLine(nLine))) {
            return [];
        }
        return getNodes(this.editor, nLine);
    }

    getNodesForAddress (address) {
        // NOTE:
        // This is an expensive process because for each call need to iterate through each line until it founds the right
        // address. Could be optimize if we store addresses in a map... but then the question is about how to keep it sync
        //
        let lastState;
        for (let line = 0; line < this.editor.getDoc().size; line++) {
            if (!this.editor.getLineHandle(line).stateAfter || !this.editor.getLineHandle(line).stateAfter.yamlState) {
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
                parseYamlString(this.editor.getLineHandle(line).text, state, 4);

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
                lastState = this.editor.getLineHandle(line).stateAfter.yamlState;
                let keys = this.getNodesOnLine(line);
                for (let key of keys) {
                    if (key.address === address) {
                        return key;
                    }
                }
            }
        }
        console.log('Fail searching', address);
    }

    // Other actions
    selectLines (strRange) {
        selectLines(this.editor, strRange);
    }
}

function showUnloadedState (editor) {
    document.querySelector('.map-view').classList.add('map-view-not-loaded');
    editor.setValue('No scene loaded.');
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
    let sceneData = getSceneContentsFromLocalMemory();
    if (sceneData) {
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
    // }
    LocalStorage.setItem(STORAGE_LAST_EDITOR_CONTENT, JSON.stringify(sceneData));
}

function getSceneContentsFromLocalMemory () {
    let sceneData = JSON.parse(LocalStorage.getItem(STORAGE_LAST_EDITOR_CONTENT));

    if (sceneData) {
        let contents = sceneData.contents;

        // TODO: Verify that contents are valid/parse-able YAML before returning it.
        // Throw away saved contents if it's "Loading...", "No scene loaded." or empty.
        // If we check for parse-ability, we won't need to hard-code the Loading check
        // (The alternative strategy is to not have the placeholder)
        if (contents && contents !== 'Loading...' && contents !== 'No scene loaded.' && contents.trim().length > 0) {
            return sceneData;
        }
    }

    return null;
}

let tangramPlay = new TangramPlay();

export default tangramPlay;
export let editor = tangramPlay.editor;

// LOAD SCENE FILE
let scene = determineScene();
tangramPlay.load(scene);
tangramPlay.initAddons();

// This is called here because right now divider position relies on
// editor and map being set up already
initDivider();

// for debug
window.tangramPlay = tangramPlay;
