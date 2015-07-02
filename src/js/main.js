'use strict';

// Imports
import Map from './core/map.js';
import Editor from './core/editor.js';
import UI from './core/ui.js';
import Widgets from './addons/widgets.js';
import SuggestedKeys from './addons/suggestedKeys.js';

export default class TangramPlay {

    constructor (options) {

        // TODO:
        //      - Create DOMs: constructor(place, options){...}

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

        if (options.ui) {
            UI.init(this,options.ui);
        } else {
            // TODO:
            //      - Only the draggable panel divider 
        }

        //  TOOD:
        //      - make TangramPlay a proper class obj 
        //      - The constructor should recive a DOM to construct the 
        //          HTML structure and options of how to load (with or with out UI, widgets and key suggestion)
        //      - review ui.js to:
        //              - dereference the "editor" variable as a global
        //              - simplify the ui.js calls (init, update, events ??)        
        window.editor = this.editor; // Temp expose editor & map globally (need by ui.js)
    }

    selectLines (rangeStr) {
        return Editor.selectLines(this.editor,rangeStr);
    }

    updateSize () {
        UI.reflowUI(this.editor);
        UI.updateUI(this);
    }

    loadFromQueryString () {
        UI.loadFromQueryString(this.editor);
    }
};

window.TangramPlay = TangramPlay;
