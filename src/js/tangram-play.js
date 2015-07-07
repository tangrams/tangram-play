// Core elements
import Map from './core/map.js';
import Editor from './core/editor.js';
import Divider from './core/divider.js';

// Addons
import Menu from './addons/menubar.js';
import WidgetsManager from './addons/widgets-manager.js';
import SuggestManager from './addons/suggest-manager.js';

export default class TangramPlay {

    constructor(placeID, options) {

        if (options.style === undefined) {
            options.style = "data/styles/basic.yaml";
        }

        // create CORE elements

        // TODO:
        //      - Create DOM for map, divider and editor

        this.map = new Map('map', options.style);
        this.editor = new Editor('editor', options.style);
        this.divider = new Divider(this);

        //  EVENTS
        let tangram_play = this;
        window.addEventListener('resize', function(){
            tangram_play.divider.reflow();
            tangram_play.divider.update();
        });

        //  ADDONS
        this.addons = {};
        if (options.widgets) this.addons.widgets_manager = new WidgetsManager(this, options.widgets);
        if (options.suggest) this.addons.suggest_manager = new SuggestManager(this, options.suggest);
        if (options.menu) this.addons.menu = new Menu(this, options.menu);
    };

    getCodeMirror() {
        return this.editor.codemirror;
    }

    selectLines(rangeStr) {
        return this.editor.selectLines(rangeStr);
    };

    loadFromQueryString() {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['style'] ? query['style'] : "data/styles/basic.yaml";
        this.editor.loadStyle(src);
    };

    takeScreenshot() {
        this.map.take_screenshot = true;
    }
};

window.TangramPlay = TangramPlay;
