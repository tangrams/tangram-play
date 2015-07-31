// Core elements
import Map from './core/Map.js';
import {initEditor} from './core/editor.js';
import Divider from './core/Divider.js';

// Addons
import UI from './addons/UI.js';
import WidgetsManager from './addons/WidgetsManager.js';
import SuggestManager from './addons/SuggestManager.js';
import GlslSandbox from './addons/GlslSandbox.js';

// Import Utils
import { fetchHTTP, debounce, StopWatch } from './core/common.js';
import { selectLines, unfoldAll, foldByLevel, isStrEmpty } from './core/codemirror/tools.js';
import { getKeyPairs, getValueRange, getAddressSceneContent } from './core/codemirror/yaml-tangram.js';

export default class TangramPlay {

    constructor(selector, options) {

        //Benchmark
        if (options.benchark) {
            window.watch = new StopWatch();
            window.watch.start();
        }
        

        if (options.style === undefined) {
            options.style = "data/styles/basic.yaml";
        }

        // create CORE elements

        // TODO:
        //      - Create DOM for map, divider and editor

        this.container = document.querySelector(selector);
        this.map = new Map(this,'map',options.style);
        this.editor = initEditor(this, 'editor');
        this.divider = new Divider(this, 'divider');
        this.options = options;

        //  EVENTS
        let tangram_play = this;
        window.addEventListener('resize', function(){
            tangram_play.divider.reflow();
            tangram_play.divider.update();
        });

        setTimeout(function () {
            if (query['lines']) {
                tangramPlay.selectLines(query['lines']);
            }
        }, 500);

        //  ADDONS
        this.addons = {};
        if (options.widgets) this.addons.widgets_manager = new WidgetsManager(this, options.widgets);
        if (options.suggest) this.addons.suggest_manager = new SuggestManager(this, options.suggest);
		if (options.sandbox) this.addons.glsl_sandbox = new GlslSandbox(this);
        if (options.ui) this.addons.ui = new UI(this);

        // LOAD STYLE
        this.loadFile(options.style);

        // window.tangramPlay = this;
    };

//  SET
    loadContent(str) {
        //  Delete API Key (TODO: check with the actual user and take out the onces that don't belong to the user)
        str = str.replace(/\?api_key\=(\w|\-)*$/gm,"");

        this.editor.setValue(str);
        this.editor.isSaved = true;
    }

    loadFile(str) {
        this.loadContent(fetchHTTP(str));
    }

    loadQuery() {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['style'] ? query['style'] : "data/styles/basic.yaml";
        this.loadFile(src);
    };

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
    };

    foldByLevel(nLevel) {
        foldByLevel(this.editor, nLevel);
    }

    unfoldAll() {
        unfoldAll(this.editor);
    }

    takeScreenshot() {
        this.map.takeScreenshot();
    }
};

window.TangramPlay = TangramPlay;
