// Core elements
import Map from 'app/core/Map';
import {initEditor} from 'app/core/editor';

// Addons
import UI from 'app/addons/UI';
import MapLoading from 'app/addons/ui/MapLoading';
import WidgetsManager from 'app/addons/WidgetsManager';
import SuggestManager from 'app/addons/SuggestManager';
import GlslSandbox from 'app/addons/GlslSandbox';
import ErrorsManager from 'app/addons/ErrorsManager';
import ColorPalette from 'app/addons/ColorPalette';

// Import Utils
import { httpGet, StopWatch, subscribeMixin } from 'app/core/common';
import { selectLines, isStrEmpty } from 'app/core/codemirror/tools';
import { getKeyPairs, parseYamlString } from 'app/core/codemirror/yaml-tangram';

const query = parseQuery(window.location.search.slice(1));
const DEFAULT_SCENE = 'data/scenes/default.yaml';

class TangramPlay {
    constructor(selector, options) {
        subscribeMixin(this);

        //Benchmark & Debuggin
        if (options.benchark) {
            window.watch = new StopWatch();
            window.watch.start();
        }

        if (options.scene === undefined) {
            options.scene = DEFAULT_SCENE;
        }

        this.container = document.querySelector(selector);
        this.map = new Map('map', options.scene);
        this.editor = initEditor('editor');
        this.options = options;
        this.addons = {};

        setTimeout(() => {
            if (query['lines']) {
                this.selectLines(query['lines']);
            }
        }, 500);

        // LOAD SCENE FILE
        this.loadFile(options.scene);

        // TODO: Manage history / routing in its own module
        window.onpopstate = (e) => {
            if (e.state && e.state.loadSceneURL) {
                this.loadQuery();
            }
        };

        // for debug
        window.tangramPlay = this;

        // Events
        this.map.layer.scene.subscribe({
            load: (args) => {
                this.trigger('scene_updated', args);
            }
        });
    }

    //  ADDONS
    initAddons () {
        let options = Object.keys(this.options);
        for (let option of options) {
            this.initAddon(option, this.options[option]);
        }
    }

    initAddon(addon, ...data) {
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
    loadContent(str) {
        MapLoading.show();

        //  Delete API Key (TODO: check with the actual user and take out the onces that don't belong to the user)
        str = str.replace(/\?api_key\=(\w|\-)*$/gm, '');

        this.editor.setValue(str);
        this.editor.clearHistory();
        this.editor.doc.markClean();
    }

    loadScene (url, { reset = false } = {}) {
        if (!this.map.scene) {
            return;
        }

        // Preserve scene base path unless reset requested (e.g. reset on new file load)
        return this.map.scene.load(url, !reset && this.map.scene.config_path);
    }

    loadFile (path) {
        MapLoading.show();

        httpGet(path, (err, res) => {
            this.loadScene(path, { reset: true }).
                then(() => this.loadContent(res));

            // Trigger Events
            this.trigger('url_loaded', { url: path });
        });
    }

    loadQuery () {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['scene'] ? query['scene'] : DEFAULT_SCENE;
        this.loadFile(src);
    }

    // SET
    setValue (KeyPair, str) {
        // Force space between the ':' and the value
        if (KeyPair.value === '') {
            str = ' ' + str;
        }

        // Calculate begining character of the value
        //               key:_[link]value
        //               ^ ^^^^ 
        //               | ||||__ + link.length
        //               | |||___ + 1 
        //               | | `--- + 1
        //  range.from.ch  key.lenght

        let from = { line: KeyPair.range.from.line,
                     ch: KeyPair.range.from.ch + KeyPair.key.length + 2 };

        if (/(^\s*(&\w+)\s+)/.test(KeyPair.value)){
            let link = /(^\s*(&\w+)\s+)/gm.exec(KeyPair.value);
            from.ch += link[1].length;
        }

        this.editor.doc.replaceRange(str, from, KeyPair.range.to);
    }

    // GET
    getContent () {
        let content = this.editor.getValue();
        let pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
        let result = '$1?api_key=vector-tiles-P6dkVl4';
        content = content.replace(pattern, result);
        return content;
    }

    getKeys (from, to) {
        let keys = [];

        if (from.line === to.line) {
            // If the searched keys are in a same line
            let line = from.line;
            let inLineKeys = this.getKeysOnLine(line);

            for (let key of inLineKeys) {
                if (key.range.to.ch > from.ch || key.range.from < to.ch) {
                    keys.push(key);
                }
            }
        }
        else {
            // If the searched keys are in a range of lines
            for (let i = from.line; i <= to.line; i++) {
                let inLineKeys = this.getKeysOnLine(i);

                for (let key of inLineKeys) {
                    if (key.range.from.line === from.line) {
                        // Is in the beginning line
                        if (key.range.to.ch > from.ch) {
                            keys.push(key);
                        }
                    }
                    else if (key.range.to.line === to.line) {
                        // is in the end line
                        if (key.range.from.ch < to.ch) {
                            keys.push(key);
                        }
                    }
                    else {
                        // is in the sandwich lines
                        keys.push(key);
                    }
                }
            }
        }
        return keys;
    }

    getKeysOnLine (nLine) {
        if (isStrEmpty(this.editor.getLine(nLine))) {
            return [];
        }
        return getKeyPairs(this.editor, nLine);
    }

    getKeyForAddress (address) {
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
                for (let key of state.keys) {
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
                let keys = this.getKeysOnLine(line);
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

// Export an instance of TangramPlay with the following modules

let tangramPlay = new TangramPlay('#tangram_play_wrapper', {
    scene: query['scene'] ? query['scene'] : DEFAULT_SCENE,
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

tangramPlay.initAddons();
new UI();
