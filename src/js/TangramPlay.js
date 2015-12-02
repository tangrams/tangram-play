// Core elements
import Map from 'app/core/Map';
import { initEditor } from 'app/core/editor';

// Addons
import UI from 'app/addons/UI';
import MapLoading from 'app/addons/ui/MapLoading';
import WidgetsManager from 'app/addons/WidgetsManager';
import SuggestManager from 'app/addons/SuggestManager';
import GlslSandbox from 'app/addons/GlslSandbox';
import ErrorsManager from 'app/addons/ErrorsManager';
import ColorPalette from 'app/addons/ColorPalette';
import LocalStorage from 'app/addons/LocalStorage';

// Import Utils
import { httpGet, StopWatch, subscribeMixin, debounce } from 'app/core/common';
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
        this.options = options;
        this.addons = {};

        // Wrap this.updateContent() in a debounce function
        this.updateContent = debounce(this.updateContent, 500);

        // LOAD SCENE FILE
        let scene = determineScene();
        this.load(scene);

        // TODO: Manage history / routing in its own module
        window.onpopstate = (e) => {
            if (e.state && e.state.sceneUrl) {
                this.load({ url: sceneUrl });
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
            let contents = this.getContent();
            saveSceneContentsToLocalMemory(contents);
        })

        // for debug
        window.tangramPlay = this;

        // Events
        this.map.layer.scene.subscribe({
            load: (args) => {
                this.trigger('scene_updated', args);
            }
        });

        // Add-ons
        this.initAddons();
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
        if (scene.url) {
            this.map = new Map('map', scene.url);
            this.loadSceneFromPath(scene.url);
        }
        else if (scene.contents) {
            let createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
            let url = createObjectURL(new Blob([scene.contents]));
            this.map = new Map('map', url);
            this.loadScene(url, { reset: true })
                .then(() => this.loadContent(scene.contents));
        }
    }

    loadContent (str) {
        MapLoading.show();

        // Remove any instances of Tangram Play's default API key
        str = suppressAPIKeys(str);

        this.editor.setValue(str);
        this.editor.clearHistory();
        this.editor.doc.markClean();
    }

    loadScene (url, { reset = false } = {}) {
        let basePath;

        if (this.map.scene) {
            basePath = this.map.scene.config_path;
        }
        // If all else fails, default to current path
        else {
            basePath = window.location.path;
        }

        // Preserve scene base path unless reset requested (e.g. reset on new file load)
        return this.map.scene.load(url, !reset && basePath);
    }

    loadSceneFromPath (path) {
        MapLoading.show();

        httpGet(path, (err, res) => {
            this.loadScene(path, { reset: true }).
                then(() => this.loadContent(res));

            // Trigger Events
            this.trigger('url_loaded', { url: path });
        });
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
        let createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
        let content = this.getContent();
        let url = createObjectURL(new Blob([content]));
        this.loadScene(url);
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
    let contents = getSceneContentsFromLocalMemory();
    if (contents) {
        scene.contents = contents;
        return scene;
    }

    // Else load the default scene file.
    scene.url = DEFAULT_SCENE;
    return scene;
}

function saveSceneContentsToLocalMemory (contents) {
    LocalStorage.setItem(STORAGE_LAST_EDITOR_CONTENT, contents);
}

function getSceneContentsFromLocalMemory () {
    let contents = LocalStorage.getItem(STORAGE_LAST_EDITOR_CONTENT);

    // TODO: Verify that contents are valid/parse-able YAML before returning it.
    // Throw away saved contents if it's "Loading..." or empty.
    // If we check for parse-ability, we won't to hard-code the Loading check
    if (contents && contents !== 'Loading...' && contents.trim().length > 0) {
        return contents;
    }
    else {
        return null;
    }
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

new UI();
