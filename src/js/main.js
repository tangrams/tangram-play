'use strict';

// Imports
import Map from './core/map.js';
import Editor from './core/editor.js';
import UI from './core/ui.js';
import Widgets from './addons/widgets.js';
import SuggestedKeys from './addons/suggestedKeys.js';

class TangramPlay {

    constructor (place, options) {

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
