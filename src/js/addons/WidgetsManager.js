import ColorPicker from './widgets/ColorPicker.js';
import ToggleButton from './widgets/ToggleButton.js';
import DropDownMenu from './widgets/DropDownMenu.js';

import { getKeyPairs } from '../core/codemirror/yaml-tangram.js';

// Load some common functions
import { fetchHTTP, toCSS, getPosition, uniqueId} from '../core/common.js';

export default class WidgetsManager {
    constructor (tangram_play, configFile ) {
        this.tangram_play = tangram_play;

        // Load data file
        let widgets_data = JSON.parse(fetchHTTP(configFile))['widgets'];
        
        this.data = [];
        this.active = [];

        // Initialize tokens
        for (let datum of widgets_data) {
            let widgetObj;

            // TODO: I'm sure there is a better and more elegant way of doing this
            switch (datum.type) {
                case 'colorpicker':
                    widgetObj = new ColorPicker(tangram_play.editor,datum);
                    break;
                case 'togglebutton':
                    widgetObj = new ToggleButton(tangram_play.editor,datum);
                    break;
                case 'dropdownmenu':
                    widgetObj = new DropDownMenu(tangram_play.editor,datum);
                    break;
                default:
                    // Nothing
                    console.log("Error loading widget ",datum);
                    break;
            }
            this.data.push(widgetObj);
        }

        //  When the viewport change (lines are add or erased)
        tangram_play.editor.on("change", function(cm, changeObj) {
            // if (changeObj.from.line === changeObj.to.line) {
                // cm.widgets_manager.update();
            // }

            cm.widgets_manager.clearAll();
            cm.widgets_manager.createAll();
        });

        // //  When the viewport change (lines are add or erased)
        tangram_play.editor.on("viewportChange", function(cm, from, to) {
            cm.widgets_manager.clearAll();
            cm.widgets_manager.createAll();
        });

        //  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.widgets_manager = this;

        this.createAll();
        this.update();
    }

    create(nLine) {
        let keys = getKeyPairs(this.tangram_play.editor, nLine);
        if (keys) {
            // Check on every key of the line
            for (let key of keys) {
                let val = key.value;
                if (val === '|' || val === '') {
                    continue;
                }

                // Check for widgets to add
                for (let datum of this.data) {
                    if(datum.check(key)){
                        this.active.push(datum.create(key, this.tangram_play.editor));
                    }
                }
            }
        }        
    }

    createAll() {
        for (let line = 0, size = this.tangram_play.editor.doc.size; line < size; line++) {
            this.create(line);
        }
        this.update();
    }

    update() {
        for (let el of this.active) {
            this.tangram_play.editor.addWidget(el.range.to, el.dom);
        }
    }

    clearAll() {
        while(this.active.length > 0) {
            this.active.pop();
        }

        let widgets = document.getElementsByClassName('widget');
        for (let i = widgets.length-1; i >=0 ; i--){
            widgets[i].parentNode.removeChild(widgets[i]);
        }
    }
};
