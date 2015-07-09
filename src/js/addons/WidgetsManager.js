import ColorPicker from './widgets/ColorPicker.js';
import ToggleButton from './widgets/ToggleButton.js';
import DropDownMenu from './widgets/DropDownMenu.js';

import { isStrEmpty } from '../core/codemirror/tools.js';
import { getKeyPairs, getValueRange } from '../core/codemirror/yaml-tangram.js';

// Load some common functions
import { fetchHTTP, debounce, uniqueId} from '../core/common.js';

var stopTyping = debounce(function(cm) {
    cm.widgets_manager.rebuild();
}, 1000);

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

        //  When there is a change
        tangram_play.editor.on("changes", function(cm, changesObj) {
            cm.widgets_manager.update();
            stopTyping(cm);
        });

        // When the viewport change (lines are add or erased)
        tangram_play.editor.on("viewportChange", function(cm, from, to) {
            cm.widgets_manager.rebuild();
        });

        tangram_play.editor.on('fold', function(cm, from, to) {
            cm.widgets_manager.rebuild();
        });

        tangram_play.editor.on('unfold', function(cm, from, to) {
            cm.widgets_manager.rebuild();
        });

        //  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.widgets_manager = this;

        // Build all widgets
        this.build();
    }

    build() {
        for (let line = 0, size = this.tangram_play.editor.doc.size; line < size; line++) {
            this.addWidgetsTo(line);
        }
        this.update();
    }

    rebuild() {
        this.deleteAll();
        this.build();
    }

    rebuildLine(nLine) {
        this.deleteLine(nLine);
        this.addWidgetsTo(nLine);
    }

    addWidgetsTo(nLine) {
        // If is visible
        if (this.tangram_play.editor.getLineHandle(nLine) && this.tangram_play.editor.getLineHandle(nLine).height) {
            // Get keys of the line
            let keys = getKeyPairs(this.tangram_play.editor, nLine);
            if (keys) {
                // Check on every key of the line
                for (let key of keys) {
                    let val = key.value;

                    if (val === '|' || isStrEmpty(val) || isStrEmpty(editor.getLine(nLine)) ) {
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
    }

    update() {
        for (let widget of this.active) {
            let keys = getKeyPairs(this.tangram_play.editor, widget.line);
            if (widget.index < keys.length){
                this.tangram_play.editor.addWidget( getValueRange(keys[widget.index]).to , widget.dom);
            } else {
                this.rebuildLine(widget.line);
                break;
            }
        }
    }

    deleteLine(nLine) {
        for (let i = this.active.length-1; i >=0; i--) {
            if (this.active[i].line === nLine){
                let dom = this.active[i].dom;
                dom.parentNode.removeChild(dom);
                this.active.splice(i,1);
            }
        }
    }

    deleteAll() {
        // Erase all Widgets
        while(this.active.length > 0) {
            let dom = this.active[ this.active.length-1].dom;
            dom.parentNode.removeChild(dom);
            this.active.pop();
        }
    }
};
