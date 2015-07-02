'use strict';

// Imports
import Map from './core/map.js';
import Editor from './core/editor.js';
import UI from './core/ui.js';
import Widgets from './addons/widgets.js';
import SuggestedKeys from './addons/suggestedKeys.js';

class TangramPlay {

    constructor (options) {

        // TODO:
        //      - Create DOMs

        //  Load main elements 
        if (options.style === undefined) {
            options.style = "data/styles/basic.yaml";
        }
        this.map = Map.init('map',options.style);
        this.editor = Editor.init('editor',options.style);

        //  Load options
        if (options.widgets) {
            Widgets.load(this.editor, options.widgets);
            Widgets.create(this.editor);
        }

        if (options.suggestedKeys) {
            SuggestedKeys.load(this.editor, options.suggestedKeys);
        }

        //  TOOD:
        //      - make TangramPlay a proper class obj 
        //      - The constructor should recive a DOM to construct the 
        //          HTML structure and options of how to load (with or with out UI, widgets and key suggestion)
        //      - review ui.js to:
        //              - dereference the "editor" variable as a global
        //              - simplify the ui.js calls (init, update, events ??)
        UI.init(this.editor, this.map);
        window.editor = this.editor; // Temp expose editor & map globally (need by ui.js)
        this.reflowUI = function() { UI.reflowUI(this.editor); }
        this.updateUI = function() { UI.updateUI(this.editor,map); }
        this.loadFromQueryString = function () { UI.loadFromQueryString(this.editor);}
    }
};

// Temporal
function create (options) {
    return new TangramPlay(options);
}

window.TangramPlay = module.exports = {
    create
};
