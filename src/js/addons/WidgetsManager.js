import { setValue, getValue } from '../core/codemirror/tools.js';
import { addToken, getAddressSceneContent } from '../core/codemirror/yaml-tangram.js';

// Load some common functions
import { fetchHTTP, toCSS, getPosition} from '../core/common.js';

export default class WidgetsManager {
    constructor (tangram_play, configFile ) {
        this.tangram_play = tangram_play;

        // Load data file
        this.data = JSON.parse(fetchHTTP(configFile))['widgets'];
        this.active = [];

        // Initialize tokens
        for (let datum of this.data) {
            datum.token = addToken(datum);
        }

        //  When the viewport change (lines are add or erased)
        tangram_play.editor.on("change", function(cm, changeObj) {
            if (changeObj.from.line === changeObj.to.line){
                cm.widgets_manager.update();
            }
        });

        //  When the viewport change (lines are add or erased)
        tangram_play.editor.on("viewportChange", function(cm, from, to) {
            cm.widgets_manager.clearAll();
            cm.widgets_manager.createAll();
        });

        //  Make link to this manager inside codemirror obj to be excecuted from CM events
        this.tangram_play.editor.widgets_manager = this;

        this.createAll();
        this.update();
    }

    update () {
        for (let el of this.active) {
            let line = parseInt(el.getAttribute('data-line'), 10);
            let ch = this.tangram_play.editor.lineInfo(line).handle.text.length;
            this.tangram_play.editor.addWidget({ line, ch }, el);
        }
    }

    create (nLine) {
        let val = getValue(this.tangram_play.editor, nLine);

        // Skip line if not significant
        if (val === '|' || val === '') return;

        // Check for widgets to add
        for (let datum of this.data) {
            if (datum.token(scene, this.tangram_play.editor, nLine)) {
                let content = getValue(this.tangram_play.editor, nLine);
                let el;

                switch (datum.type) {
                    case 'colorpicker':
                        el = createColorpickerWidget(this.tangram_play.editor, datum, content, nLine);
                        break;
                    case 'togglebutton':
                        el = createToggleWidget(this.tangram_play.editor, datum, content, nLine);
                        break;
                    case 'dropdownmenu':
                        el = createDropdownWidget(this.tangram_play.editor, datum, content, nLine);
                        break;
                    case 'dropdownmenu-dynamic':
                        el = createDropdownDynamicWidget(this.tangram_play.editor, datum, content, nLine);
                        break;
                    default:
                        // Nothing
                        break;
                }

                el.setAttribute('data-line', nLine); // TODO: change
                this.active.push(el);
            }
        }
    }

    createAll () {
        for (let line = 0, size = this.tangram_play.editor.doc.size; line < size; line++) {
            this.create(line);
        }
        this.update();
    }

    clear (nLine) {
        for (let el of this.active) {
            let line = parseInt(el.getAttribute('data-line'), 10);
            if (line === nLine){
                el.parentNode.removeChild(el);
                break;
            }
        }
    }

    clearAll () {
        while(this.active.length > 0) {
            this.active.pop();
        }

        let widgets = document.getElementsByClassName('widget');
        for (let i = widgets.length-1; i >=0 ; i--){
            widgets[i].parentNode.removeChild(widgets[i]);
        }
    }
};

function createColorpickerWidget (cm, proto, content, nline) {
    let btn = document.createElement('div');
    btn.className = 'widget widget-colorpicker';
    btn.value = nline;
    btn.style.background = toCSS(content);
    btn.addEventListener('click', function (e) {
        let picker = new thistle.Picker(btn.style.background);

        let pos = getPosition(btn);
        picker.presentModal(pos.x+20,
                            cm.heightAtLine(parseInt(btn.value))+20);

        picker.on('changed', function() {
            btn.style.background = picker.getCSS();
            let color = picker.getRGB();
            let str = "["+ color.r.toFixed(3) + "," + color.g.toFixed(3) + "," + color.b.toFixed(3) + "]";
            setValue( cm, parseInt(btn.value), str );
        });
    });
    return btn;
}

function createToggleWidget (cm, proto, content, nline) {
    let check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'widget widget-toggle';
    check.checked = (content === 'true') ? true : false;
    check.value = nline;
    check.addEventListener('change', function (e) {
        setValue(cm, parseInt(check.value), check.checked?"true":"false" );
    });
    return check;
}

function createDropdownWidget (cm, proto, content, nline) {
    let el = document.createElement('select');
    el.className = 'widget widget-dropdown';

    for (let i = 0; i < proto.options.length; i++ ) {
        let newOption = document.createElement('option');
        newOption.value = nline;
        if (content === proto.options[i]) {
            newOption.selected = true;
        }
        newOption.innerHTML = proto.options[i];
        el.appendChild(newOption);
    }

    el.addEventListener('change', function (e) {
        setValue( cm, parseInt(el.options[el.selectedIndex].value), el.options[el.selectedIndex].innerHTML );
    });
    return el;
}

function createDropdownDynamicWidget (cm, proto, content, nline) {
    let el = document.createElement('select');
    let obj = getAddressSceneContent(scene, proto.source);
    let keys = (obj) ? Object.keys(obj) : {};

    el.className = 'widget widget-dropdown-dynamic';

    if (proto.options) {
        for (let i = 0; i < proto.options.length; i++) {
            let newOption = document.createElement('option');
            newOption.value = nline;
            if (content === proto.options[i]) {
                newOption.selected = true;
            }
            newOption.innerHTML= proto.options[i];
            el.appendChild(newOption);
        }
    }

    for (let j = 0; j < keys.length; j++) {
        let newOption = document.createElement('option');
        newOption.value = nline;
        if (content === keys[j]) {
            newOption.selected = true;
        }
        newOption.innerHTML= keys[j];
        el.appendChild(newOption);
    }

    el.addEventListener('change', function (e) {
        setValue( cm, parseInt(el.options[el.selectedIndex].value), el.options[el.selectedIndex].innerHTML );
    });
    return el;
}

