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

    //  TOOD:
    //       - probably there is a better way to do this
    //
    
    // Create DOMs
    //
    var dom = document.getElementById(place);
    dom.innerHTML = "<div id='menu-container'>\n\
            <div class='menu-bar'>\n\
                <h1>Tangram Play</h1>\n\
                <ul id='menu-holder' class='menu-items'>\n\
                    <li class='menu-item' id='menu-button-new' data-title='New style'><i class='btm bt-file'></i></li>\n\
                    <li class='menu-item' id='menu-button-open' data-title='Open file'><i class='btm bt-plus-square'></i></li>\n\
                    <li class='menu-item' id='menu-button-export' data-title='Export style'><i class='btm bt-download'></i></li>\n\
                    <li class='menu-item menu-item-private' data-title='Share'><i class='btm bt-share'></i></li>\n\
                </ul>\n\
                <ul id='menu-holder' class='menu-items menu-right'>\n\
                    <li class='menu-item menu-item-private' data-title='Refresh map'><i class='btm bt-sync'></i></li>\n\
                    <li class='menu-item menu-item-private' data-title='Settings'><i class='btm bt-gear'></i></li>\n\
                    <li class='menu-item' data-title='Documentation and help'><a href='https://github.com/tangrams/tangram-docs#tangram-documentation' target='_blank'><i class='btm bt-question-circle'></i></a></li>\n\
                    <li class='menu-item menu-item-private menu-sign-in' data-title='Sign in'><span class='menu-sign-in-label'>Sign in</span><i class='btm bt-sign-in'></i></li>\n\
                </ul>\n\
            </div>\n\
            <div class='menu-dropdowns'>\n\
                <div class='menu-dropdown menu-dropdown-open' id='menu-open'>\n\
                    <ul>\n\
                        <li id='menu-open-file'><i class='btm bt-folder'></i> Open a file</li>\n\
                        <li id='menu-open-example'><i class='btm bt-map'></i> Choose example</li>\n\
                    </ul>\n\
                </div>\n\
            </div>\n\
        </div>\n\
        \n\
        <div id='map'></div>\n\
        <div id='divider'><span class='divider-affordance'></span></div>\n\
        <div id='content'>\n\
            <div id='editor'></div>\n\
        </div>\n\
        \n\
        <div id='shield' class='shield'></div>\n\
        <div id='confirm-unsaved' class='modal'>\n\
            <p class='modal-text'>Your style has not been saved. Continue?</p>\n\
            \n\
            <div class='modal-buttons'>\n\
                <button id='modal-cancel'><i class='btm bt-times'></i> Cancel</button>\n\
                <button id='modal-confirm'><i class='btm bt-check'></i> Continue</button>\n\
            </div>\n\
        </div>\n\
        \n\
        <div id='choose-example' class='modal example-modal'>\n\
            <p class='modal-text'>Choose example to open</p>\n\
            \n\
            <div class='examples-container'>\n\
                <div id='examples'></div>\n\
            </div>\n\
            \n\
            <div class='modal-buttons'>\n\
                <button id='example-cancel'><i class='btm bt-times'></i> Cancel</button>\n\
                <button id='example-confirm' disabled><i class='btm bt-check'></i> Open</button>\n\
            </div>\n\
        </div>\n\
        \n\
        <div id='file-drop' class='file-drop-container'>\n\
            <div class='file-drop-indicator'>\n\
                <div class='file-drop-icon'><i class='btm bt-upload'></i></div>\n\
                <div class='file-drop-label'>Drop a file here to open</div>\n\
            </div>\n\
        </div>\n\
    ";

    //  Load main elements 
    //
    const map = Map.init('map',options.style);
    const editor = Editor.init('editor',options.style);
    UI.init(editor, map);

    // TODO: 
    //       - dereference the "editor" variable as a global
    window.editor = editor; // Temp expose editor & map globally

    // Construct the OBJ
    this.editor = editor;
    this.map = map;
    var tangram_play = this;

    if (options.widgets) {
        Widgets.load(editor, options.widgets);
        Widgets.create(editor);
    }

    // Editor Widgets
    if (options.suggestedKeys) {
        SuggestedKeys.load(editor, options.suggestedKeys);
    }

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

    return tangram_play;
};

window.TangramPlay = module.exports = {
    create
};
