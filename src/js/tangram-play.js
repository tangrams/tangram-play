// Core elements
import Map from './core/map.js';
import Editor from './core/editor.js';
import Divider from './core/divider.js';

// Addons
import Menu from './addons/menubar.js';
import WidgetsManager from './addons/widgets-manager.js';
import SuggestManager from './addons/suggest-manager.js';

export default class TangramPlay {

    constructor (options) {

        // TODO:
        //      - Create DOMs: constructor(place, options){...}

        //  Load main elements
        if (options.style === undefined) {
            options.style = "data/styles/basic.yaml";
        }

        this.map = new Map('map', options.style);
        this.editor = new Editor('editor', options.style);
        this.divider = new Divider(this);

        //  Load options
        if (options.widgets) {
            this.widgets_manager = new WidgetsManager(this, options.widgets);
        }

        if (options.suggest) {
            this.sugest_manager = new SuggestManager(this, options.suggest);
        }

        if (options.menu) {
            this.menu = new Menu(this, options.menu);
        } else {
            // TODO:
            //      - Only the draggable panel divider
        }

        let tangram_play = this;

        window.addEventListener('resize', function(){
            tangram_play.updateSize();
        });

    };

    selectLines (rangeStr) {
        return this.editor.selectLines(rangeStr);
    };

    updateSize () {
        this.divider.reflow();
        this.divider.update();
    };

    loadFromQueryString () {
        let query = parseQuery(window.location.search.slice(1));
        let src = query['style'] ? query['style'] : "data/styles/basic.yaml";
        this.editor.loadStyle(src);
    };
};

window.TangramPlay = TangramPlay;
