// Core elements
import Map from 'app/core/Map';
import { initEditor } from 'app/core/editor';

// Addons
import UI from 'app/addons/UI';
import MapLoading from 'app/addons/ui/MapLoading';
import Modal from 'app/addons/ui/Modal';
import WidgetsManager from 'app/addons/WidgetsManager';
import SuggestManager from 'app/addons/SuggestManager';
import GlslSandbox from 'app/addons/GlslSandbox';
import ErrorsManager from 'app/addons/ErrorsManager';
import ColorPalette from 'app/addons/ColorPalette';
import LocalStorage from 'app/addons/LocalStorage';

// Import Utils
import xhr from 'xhr';
import { StopWatch, subscribeMixin, debounce, createObjectURL } from 'app/core/common';
import { selectLines, isStrEmpty } from 'app/core/codemirror/tools';
import { getNodes, parseYamlString } from 'app/core/codemirror/yaml-tangram';

const query = parseQuery(window.location.search.slice(1));

const DEFAULT_SCENE = 'data/scenes/default.yaml';
const STORAGE_LAST_EDITOR_CONTENT = 'last-content';

// Default API key to use in scene files that do not provide one (Patricio is the owner)
const DEFAULT_API_KEY = 'vector-tiles-P6dkVl4';

class TangramPlay {
    constructor (selector, options) {
        subscribeMixin(this);

        //Benchmark & Debuggin
        if (options.benchark) {
            window.watch = new StopWatch();
            window.watch.start();
        }

        this.container = document.querySelector(selector);
        this.editor = initEditor('editor');
        this.map = new Map('map');
        this.options = options;
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
                'original_url': this.map.scene.config_source,
                'original_base_path': this.map.scene.config_path,
                'contents': this.getContent(),
                'is_clean': this.editor.isClean()
            }
            saveSceneContentsToLocalMemory(sceneData);
        });
    }

    //  ADDONS
    initAddons () {
        let options = Object.keys(this.options);
        for (let option of options) {
            this.initAddon(option, this.options[option]);
        }
    }

    initAddon (addon, ...data) {
        console.log('Loading addon', addon, ...data);
        switch(addon) {
            case 'widgets':
                if (this.addons.widgetsManager === undefined) {
                    this.addons.widgetsManager = new WidgetsManager(...data);
                }
                break;
            case 'suggest':
                if (this.addons.suggestManager === undefined) {
                    this.addons.suggestManager = new SuggestManager(...data);
                }
                break;
            case 'sandbox':
                if (this.addons.glslSandbox === undefined) {
                    this.addons.glslSandbox = new GlslSandbox();
                }
                break;
            case 'errors':
                if (this.addons.errorsManager === undefined) {
                    this.addons.errorsManager = new ErrorsManager();
                }
                break;
            case 'colors':
                if (this.addons.colorPalette === undefined) {
                    this.addons.colorPalette = new ColorPalette();
                }
                break;
        }
    }

    // LOADers
    load (scene) {
        console.log('Loading scene', scene);

        // Turn on loading indicator. This is turned off later
        // when Tangram reports that it's done.
        MapLoading.show();

        // Turn off watching for changes in editor.
        this.editor.off('changes', this._watchEditorForChanges);

        // Either we are passed a url path, or scene file contents
        if (scene.url) {
            xhr.get(scene.url, (error, response, body) => {
                if (error) {
                    let errorModal = new Modal(error);
                    return errorModal.show();
                }
                scene.contents = body;
                this._doLoadProcess(scene);
            });
        }
        else if (scene.contents) {
            this._doLoadProcess(scene);
        }
    }

    _doLoadProcess (scene) {
        let url = scene.url || createObjectURL(scene.contents);

        // Send url to map and contents to editor
        // TODO: get contents from Tangram instead of another xhr request.
        // console.log(scene)
        this.map.loadScene(url, {
            reset: true,
            basePath: scene['original_base_path']
        });
        this._setSceneContentsInEditor(scene);

        // Update history
        let locationPrefix = '.';
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
        if (!!sceneData['is_clean']) {
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
        let content = this.getContent();
        let url = createObjectURL(content);
        this.map.loadScene(url);
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

    takeScreenshot () {
        this.map.takeScreenshot();
    }
}

function parseQuery (qstr) {
    let query = {};
    let a = qstr.split('&');
    for (let i in a) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}

// Determine what is the scene url and content to load during start-up
function determineScene () {
    let scene = {};

    // If there is a query, return it
    let query = parseQuery(window.location.search.slice(1));
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
        // Throw away saved contents if it's "Loading..." or empty.
        // If we check for parse-ability, we won't need to hard-code the Loading check
        // (The alternative strategy is to not have the placeholder)
        if (contents && contents !== 'Loading...' && contents.trim().length > 0) {
            return sceneData;
        }
    }

    return null;
}

// Files loaded without API keys need to have "our own" key injected so that
// the scene can be rendered by Tangram.
function injectAPIKeys (content) {
    const pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
    const result = `$1?api_key=${DEFAULT_API_KEY}`;
    return content.replace(pattern, result);
}

// Before displaying scene file content, scrub it for keys that match the
// default internal Tangram Play API key.
// (TODO: check with the actual user and take out the ones that don't belong to the user)
function suppressAPIKeys (content) {
    const escapedApiKey = DEFAULT_API_KEY.replace(/\-/g, '\\-');
    const re = new RegExp(`\\?api_key\\=${escapedApiKey}`, 'gm');
    return content.replace(re, '');
}

// Export an instance of TangramPlay with the following modules

let tangramPlay = new TangramPlay('#tangram_play_wrapper', {
    suggest: 'data/tangram-api.json',
    widgets: 'data/tangram-api.json',
    menu: 'data/menu.json',
    // sandbox: true,
    errors: true,
    colors: true,
});

export default tangramPlay;
export let map = tangramPlay.map;
export let container = tangramPlay.container;
export let editor = tangramPlay.editor;

// LOAD SCENE FILE
let scene = determineScene();
tangramPlay.load(scene);
tangramPlay.initAddons();
tangramPlay.ui = new UI();

// for debug
window.tangramPlay = tangramPlay;
