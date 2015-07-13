// Load some common functions
import { fetchHTTP, debounce, uniqueId} from '../core/common.js';
import { isStrEmpty } from '../core/codemirror/tools.js';
import { getValueRange } from '../core/codemirror/yaml-tangram.js';

// Load addons modules
import ColorPicker from './widgets/ColorPicker.js';
import ToggleButton from './widgets/ToggleButton.js';
import DropDownMenu from './widgets/DropDownMenu.js';

// Debounced event after user stop doing something
var stopAction = debounce(function(cm) {
    cm.widgets_manager.rebuild();
}, 1000);

export default class WidgetsManager {
    constructor (tangram_play, configFile ) {

        //  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.widgets_manager = this;

        // Local variables
        this.tangram_play = tangram_play;
        this.fresh = true;  // widget - key sync
        this.data = [];     // tokens to check
        this.active = [];   // active widgets

        // Load data file
        let widgets_data = JSON.parse(fetchHTTP(configFile))['widgets'];

        // Initialize tokens
        for (let datum of widgets_data) {
            let widgetObj;

            // TODO: I'm sure there is a better and more elegant way of doing this
            switch (datum.type) {
                case 'colorpicker':
                    widgetObj = new ColorPicker(this,datum);
                    break;
                case 'togglebutton':
                    widgetObj = new ToggleButton(this,datum);
                    break;
                case 'dropdownmenu':
                    widgetObj = new DropDownMenu(this,datum);
                    break;
                default:
                    // Nothing
                    console.log("Error loading widget ",datum);
                    break;
            }
            this.data.push(widgetObj);
        }

        // Suggestions are trigged by the folowing CM events

        //  When there is a change
        // tangram_play.editor.on("changes", function(cm, changesObj) {
        //     cm.widgets_manager.fresh = false;
        //     cm.widgets_manager.update();
        //     stopAction(cm);
        // });

        // When the viewport change (lines are add or erased)
        tangram_play.editor.on("viewportChange", function(cm, from, to) {
            cm.widgets_manager.fresh = false;
            cm.widgets_manager.rebuild();
        });

        tangram_play.editor.on('unfold', function(cm, from, to) {
            cm.widgets_manager.fresh = false;
            cm.widgets_manager.rebuild();
        });

        tangram_play.editor.on('update', function(cm) {
            cm.widgets_manager.fresh = false;
            cm.widgets_manager.update();
            stopAction(cm);
        });

        // Build all widgets
        this.build();        
    }

    build() {
        for (let line = 0, size = this.tangram_play.editor.doc.size; line < size; line++) {
            this.addWidgetsTo(line);
        }
        this.fresh = true;
        this.update();
    }

    rebuild() {
        if (!this.fresh) {
            this.deleteAll();
            this.build();
        }
    }

    rebuildLine(nLine) {
        this.deleteLine(nLine);
        this.addWidgetsTo(nLine);
    }

    addWidgetsTo(nLine) {
        // If is visible
        if (this.tangram_play.editor.getLineHandle(nLine) && this.tangram_play.editor.getLineHandle(nLine).height) {
            // Get keys of the line
            let keys = this.tangram_play.getKeysOnLine(nLine);
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
        // Update widgets unles somethings is not right
        for (let widget of this.active) {
            let keys = this.tangram_play.getKeysOnLine(widget.line);
                if (this.tangram_play.editor.getLineHandle(widget.line) && this.tangram_play.editor.getLineHandle(widget.line).height) {
                    if (widget.index < keys.length){
                    this.tangram_play.editor.addWidget( getValueRange(keys[widget.index]).to , widget.dom);
                } else {
                    this.rebuildLine(widget.line);
                    break;
                }
            } else {
                this.fresh = false;
                this.rebuild();
                break;
            }
            
        }
    }

    deleteLine(nLine) {
        // Erase the widgets on one line
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
            if (dom && dom.parentNode){
                dom.parentNode.removeChild(dom);
            }
            this.active.pop();
        }
    }
};
