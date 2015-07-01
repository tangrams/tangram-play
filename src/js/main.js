'use strict';

// Imports
const Utils = require('./core/common.js');
const Map = require('./core/map.js');
const Editor = require('./core/editor.js');
const UI = require('./core/ui.js');
const Widgets = require('./addons/widgets.js');
const SuggestedKeys = require('./addons/suggestedKeys.js');

function create (place, options) {

    if (options.style === undefined){
        options.style = "data/styles/basic.yaml";
    }

    // Create DOMs
    //

    //  Load main elements 
    //
    const map = Map.init('map',options.style);
    const editor = Editor.init('editor',options.style);
    UI.init(editor, map);

    // Temp expose editor & map globally
    window.editor = editor;
    // window.map = map;

    // TODO: 
    //       - dereference the editor as a global

    // Editor Widgets
    Widgets.load(editor, 'data/widgets.json');
    SuggestedKeys.load(editor, 'data/keys.json');

    // Construct the OBJ
    //
    this.editor = editor;
    this.map = map;
    var tangram_play = this;

    // public methots
    //
    this.reflowUI = function() {
        UI.reflowUI(editor);
    }

    this.updateUI = function() {
        UI.updateUI(editor,map);
    }

    this.loadFromQueryString = function (){
        UI.loadFromQueryString(editor);
    }

    Widgets.create(editor);
    
    return tangram_play;
};

window.TangramPlay = module.exports = {
    create
};
