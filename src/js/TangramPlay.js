// Core elements
import Map from './core/Map.js';
import {initEditor} from './core/editor.js';

// Addons
import UI from './addons/UI.js';
import MapLoading from './addons/ui/MapLoading.js';
import WidgetsManager from './addons/WidgetsManager.js';
import SuggestManager from './addons/SuggestManager.js';
import GlslSandbox from './addons/GlslSandbox.js';
import ErrorsManager from './addons/ErrorsManager.js';
import ColorPalette from './addons/ColorPalette.js';

// Import Utils
import { httpGet, StopWatch } from './core/common.js';
import { selectLines, unfoldAll, foldByLevel, isStrEmpty } from './core/codemirror/tools.js';
import { getKeyPairs, getValueRange, getAddressSceneContent } from './core/codemirror/yaml-tangram.js';

const query = parseQuery(window.location.search.slice(1));

class TangramPlay {
    constructor(selector, options) {
        //Benchmark & Debuggin
        if (options.benchark) {
            window.watch = new StopWatch();
            window.watch.start();
        }

        if (options.style === undefined) {
            options.style = 'data/styles/basic.yaml';
        }

        this.container = document.querySelector(selector);
        this.map = new Map('map', options.style);
        this.editor = initEditor('editor');
        this.options = options;
        this.addons = {};

        //  EVENTS
        // Create Events
        this.onLoaded = new CustomEvent('loaded');

        setTimeout(() => {
            if (query['lines']) {
                this.selectLines(query['lines']);
            }
        }, 500);

        // LOAD STYLE
        this.loadFile(options.style);

        // TODO: Manage history / routing in its own module
        window.onpopstate = (e) => {
            if (e.state && e.state.loadStyleURL) {
                this.loadQuery();
            }
        };

        // for debug
        window.tangramPlay = this;
    }

    //  ADDONS
    initAddons () {
        if (this.options.widgets) {
            this.addons.widgetsManager = new WidgetsManager(this.options.widgets);
        }
        if (this.options.suggest) {
            this.addons.suggestManager = new SuggestManager(this, this.options.suggest);
        }
        if (this.options.sandbox) {
            this.addons.glslSandbox = new GlslSandbox(this);
        }
        if (this.options.errors) {
            this.addons.errorsManager = new ErrorsManager();
        }
        if (this.options.colors) {
            this.addons.colorPalette = new ColorPalette();
        }
    }

    // LOADers
    loadContent(str) {
        MapLoading.show();

        //  Delete API Key (TODO: check with the actual user and take out the onces that don't belong to the user)
        str = str.replace(/\?api_key\=(\w|\-)*$/gm, '');

        this.editor.setValue(str);
        this.editor.isSaved = true;
    }

    loadFile (path) {
        MapLoading.show();

        httpGet(path, (err, res) => {
            this.loadContent(res);

            // Trigger Events
            this.container.dispatchEvent(this.onLoaded);
        });
    }

    loadQuery() {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['style'] ? query['style'] : 'data/styles/basic.yaml';
        this.loadFile(src);
    }

    // SET
    setValue(KeyPair, str) {
        let range = getValueRange(KeyPair);
        if (KeyPair.value === '') {
            str = ' ' + str;
        }
        this.editor.doc.replaceRange(str, range.from, range.to);
    }

    // GET
    getContent() {
        let content = this.editor.getValue();
        let pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
        let result = '$1?api_key=vector-tiles-P6dkVl4';
        content = content.replace(pattern, result);
        return content;
    }

    getKeysOnLine(nLine) {
        if (isStrEmpty(this.editor.getLine(nLine))) {
            return [];
        }
        return getKeyPairs(this.editor, nLine);
    }

    getKeyForStr(str) {
        let pos = str.split('-');
        if (pos.length === 2) {
            let keys = this.getKeysOnLine(parseInt(pos[0]));
            let index = parseInt(pos[1]);
            if (keys && index < keys.length) {
                return keys[index];
            }
        }
    }

    getKeyForKey(key) {
        return this.getKey(key.pos.line, key.index);
    }

    getKey(nLine, nIndex) {
        if (nIndex === undefined) {
            return this.getKeysOnLine(nLine);
        }

        let keys = this.getKeysOnLine(nLine);
        if (keys && nIndex < keys.length) {
            return keys[nIndex];
        }

        return [];
    }

    getKeyForAddress(address) {
        for (let line = 0; line < this.editor.getDoc().size; line++) {
            let keys = this.getKeysOnLine(line);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].address === address) {
                    return keys[i];
                }
            }
        }
    }

    getAddressContent(address) {
        return getAddressSceneContent(this.scene, address);
    }

    // Check

    // Other actions
    selectLines(strRange) {
        selectLines(this.editor, strRange);
    }

    foldByLevel(nLevel) {
        foldByLevel(this.editor, nLevel);
    }

    unfoldAll() {
        unfoldAll(this.editor);
    }

    takeScreenshot() {
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
    style: query['style'] ? query['style'] : 'data/styles/basic.yaml',
    // suggest: 'data/suggest.json',
    widgets: 'data/widgets.json',
    menu: 'data/menu.json',
    // sandbox: true,
    errors: true,
    colors: true,
});

export default tangramPlay;

tangramPlay.initAddons();
new UI();
