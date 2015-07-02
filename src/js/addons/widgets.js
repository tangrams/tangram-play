'use strict';

import YAMLTangram from '../parsers/yaml-tangram.js';
//import {Widget} from './widgets/widget';

// Load some common functions
import {fetchHTTP, toCSS, getPosition} from '../core/common.js';

let widgets = [];
let data = [];

let WidgetManager = {
    load,
    create,
    update
}

// Placeholders for global editor
let cm;
let editor;

export default WidgetManager;

function load (configFile) {
    // Set reference to global object
    cm = window.editor;
    editor = window.editor;

    // Load data file
    data = JSON.parse(fetchHTTP(configFile))['widgets'];

    // Initialize tokens
    for (let datum of data) {
        datum.token = YAMLTangram.addToken(datum);
    }

    // Create and append all widgets
    create();
}

function create () {
    for (let line = 0, size = editor.doc.size; line < size; line++) {
        let val = YAMLTangram.getValue(editor, line);

        // Skip line if not significant
        if (val === '|' || val === '') continue;

        // Check for widgets to add
        for (let datum of data) {
            if (datum.token(scene, editor, line)) {
                let content = YAMLTangram.getValue(editor, line);
                let el;

                switch (datum.type) {
                    case 'colorpicker':
                        el = createColorpickerWidget(editor, datum, content, line);
                        break;
                    case 'togglebutton':
                        el = createToggleWidget(editor, datum, content, line);
                        break;
                    case 'dropdownmenu':
                        el = createDropdownWidget(editor, datum, content, line);
                        break;
                    case 'dropdownmenu-dynamic':
                        el = createDropdownDynamicWidget(editor, datum, content, line);
                        break;
                    default:
                        // Nothing
                        break;
                }

                el.setAttribute('data-line', line); // TODO: change
                widgets.push(el);
            }
        }
    }

    setPositions();
}

function setPositions () {
    for (let el of widgets) {
        let line = parseInt(el.getAttribute('data-line'), 10);
        let ch = editor.lineInfo(line).handle.text.length;
        editor.addWidget({ line, ch }, el);
    }
}

function clearAll () {
    var widgets = document.getElementsByClassName('widget');
    while (widgets[0]) {
        widgets[0].parentNode.removeChild(widgets[0]);
    }
}

function clear (widgetId) {

}

function update (cm) {
    clearAll();
    setPositions(cm);
}

/**
 * @param {array} changes - An array of changes in a batch operation from CodeMirror.
 */
function updateWidgetsOnEditorChanges (changes) {
    // Given changed lines in CodeMirror
    // We need to rebuild some widgets because data may have changed in them.
    console.log(changes);
    // TODO.
}

function createColorpickerWidget (cm, proto, content, nline) {
    var btn = document.createElement('div');
    btn.className = 'widget widget-colorpicker';
    btn.value = nline;
    btn.style.background = toCSS(content);
    btn.addEventListener('click', function (e) {
        var picker = new thistle.Picker(btn.style.background);

        var pos = getPosition(btn);
        picker.presentModal(pos.x+20,
                            cm.heightAtLine(parseInt(btn.value))+20);

        picker.on('changed', function() {
            btn.style.background = picker.getCSS();
            var color = picker.getRGB();
            var str = "["+ color.r.toFixed(3) + "," + color.g.toFixed(3) + "," + color.b.toFixed(3) + "]";
            YAMLTangram.setValue( cm, parseInt(btn.value), str );
        });
    });
    return btn;
}

function createToggleWidget (cm, proto, content, nline) {
    var check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'widget widget-toggle';
    check.checked = (content === 'true') ? true : false;
    check.value = nline;
    check.addEventListener('change', function (e) {
        YAMLTangram.setValue(cm, parseInt(check.value), check.checked?"true":"false" );
    });
    return check;
}

function createDropdownWidget (cm, proto, content, nline) {
    var el = document.createElement('select');
    el.className = 'widget widget-dropdown';

    for (var i = 0; i < proto.options.length; i++ ) {
        var newOption = document.createElement('option');
        newOption.value = nline;
        if (content === proto.options[i]) {
            newOption.selected = true;
        }
        newOption.innerHTML = proto.options[i];
        el.appendChild(newOption);
    }

    el.addEventListener('change', function (e) {
        YAMLTangram.setValue( cm, parseInt(el.options[el.selectedIndex].value), el.options[el.selectedIndex].innerHTML );
    });
    return el;
}

function createDropdownDynamicWidget (cm, proto, content, nline) {
    var el = document.createElement('select');
    var obj = YAMLTangram.getAddressSceneContent(scene, proto.source);
    var keys = (obj) ? Object.keys(obj) : {};

    el.className = 'widget widget-dropdown-dynamic';

    if (proto.options) {
        for (var i = 0; i < proto.options.length; i++) {
            var newOption = document.createElement('option');
            newOption.value = nline;
            if (content === proto.options[i]) {
                newOption.selected = true;
            }
            newOption.innerHTML= proto.options[i];
            el.appendChild(newOption);
        }
    }

    for (var j = 0; j < keys.length; j++) {
        var newOption = document.createElement('option');
        newOption.value = nline;
        if (content === keys[j]) {
            newOption.selected = true;
        }
        newOption.innerHTML= keys[j];
        el.appendChild(newOption);
    }

    el.addEventListener('change', function (e) {
        YAMLTangram.setValue( cm, parseInt(el.options[el.selectedIndex].value), el.options[el.selectedIndex].innerHTML );
    });
    return el;
}

