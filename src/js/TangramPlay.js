// Core elements
import Map from './core/Map.js';
import {initEditor} from './core/editor.js';

// Addons
import UI from './addons/UI.js';
import WidgetsManager from './addons/WidgetsManager.js';
import SuggestManager from './addons/SuggestManager.js';
import GlslSandbox from './addons/GlslSandbox.js';

// Import Utils
import { fetchHTTP, debounce, StopWatch } from './core/common.js';
import { selectLines, unfoldAll, foldByLevel, isStrEmpty } from './core/codemirror/tools.js';
import { getKeyPairs, getValueRange, getAddressSceneContent } from './core/codemirror/yaml-tangram.js';

class TangramPlay {
    constructor(selector, options) {

        //Benchmark
        if (options.benchark) {
            window.watch = new StopWatch();
            window.watch.start();
        }

        if (options.style === undefined) {
            options.style = 'data/styles/basic.yaml';
        }

        this.container = document.querySelector(selector);
        this.map = new Map(this, 'map', options.style);
        this.editor = initEditor(this, 'editor');
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
    }

    //  ADDONS
    initAddons () {
        if (this.options.widgets) this.addons.widgets_manager = new WidgetsManager(this, this.options.widgets);
        if (this.options.suggest) this.addons.suggest_manager = new SuggestManager(this, this.options.suggest);
        if (this.options.sandbox) this.addons.glsl_sandbox = new GlslSandbox(this);
        if (this.options.ui) this.addons.ui = new UI();
    }

//  SET
    loadContent(str) {
        //  Delete API Key (TODO: check with the actual user and take out the onces that don't belong to the user)
        str = str.replace(/\?api_key\=(\w|\-)*$/gm,"");

        this.editor.setValue(str);
        this.editor.isSaved = true;
    }

    loadFile(str) {
        this.loadContent(fetchHTTP(str));

        // Trigger Events
        this.container.dispatchEvent(this.onLoaded);
    }

    loadQuery() {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['style'] ? query['style'] : "data/styles/basic.yaml";
        this.loadFile(src);
    }

// SET
    setValue(KeyPair, str){
        let range = getValueRange(KeyPair);
        if (KeyPair.value === ""){
            str = " " + str;
        }
        this.editor.doc.replaceRange(str,range.from,range.to);
    }

// GET
    getContent() {
        let content = this.editor.getValue();
        let pattern = /(^\s+url:\s+([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\:)+(topojson|geojson|mvt)$)/gm;
        let result = "$1?api_key=vector-tiles-P6dkVl4"
        content = content.replace(pattern, result);
        return content;
    }

    getKeysOnLine(nLine) {
        if ( isStrEmpty(this.editor.getLine(nLine)) ){
            return [];
        }
        return getKeyPairs(this.editor, nLine);
    }

    getKeyForStr(str) {
        let pos = str.split("-");
        if (pos.length === 2){
            let keys = this.getKeysOnLine(parseInt(pos[0]));
            let index = parseInt(pos[1]);
            if (keys && index < keys.length ){
                return keys[index];
            }
        }
    }

    getKeyForKey(key) {
        return this.getKey(key.pos.line,key.index);
    }

    getKey(nLine, nIndex) {
        if (nIndex === undefined) {
            return getKeysOnLine(nLine);
        }

        let keys = this.getKeysOnLine(nLine);
        if (keys && nIndex < keys.length ){
            return keys[nIndex];
        }

        return [];
    }

    getKeyForAddress(address) {
        for (let line = 0; line < this.editor.getDoc().size; line++ ) {
            let keys = this.getKeysOnLine(line);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].address == address){
                    return keys[i];
                }
            }
        }
    }

    getAddressContent(address) {
        return getAddressSceneContent(this.scene,address);
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

const query = parseQuery(window.location.search.slice(1));

function parseQuery(qstr) {
    var query = {};
    var a = qstr.split('&');
    for (var i in a) {
        var b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
};

// Export an instance of TangramPlay with the following modules

let tangramPlay = new TangramPlay('#tangram_play_wrapper', {
    style: query['style'] ? query['style'] : 'data/styles/basic.yaml',
    // suggest: 'data/suggest.json',
    widgets: 'data/widgets.json',
    menu: 'data/menu.json',
    // sandbox: true,
    ui: true
});

export default tangramPlay;

tangramPlay.initAddons();
