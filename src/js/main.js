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
        //      - Reveiw and optimize this
        UI.init(this.editor, this.map);

        //  TODO: 
        //       - dereference the "editor" variable as a global
        //       - simplify the ui.js calls (init, update, events ??)
        window.editor = this.editor; // Temp expose editor & map globally

        // public methots from UI ( TODO: simplify this calls )
        //
        this.reflowUI = function() {
            UI.reflowUI(this.editor);
        }

        this.updateUI = function() {
            UI.updateUI(this.editor,map);
        }

        this.loadFromQueryString = function (){
            UI.loadFromQueryString(this.editor);
        }
    }
};

// TODO:
//      - there should be a better way to do this
function create (place, options) {
    return new TangramPlay(place, options);
}

window.TangramPlay = module.exports = {
    create
};
