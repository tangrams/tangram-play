'use strict';

const Utils = require('../core/common.js');
const YAMLTangram = require('../parsers/yaml-tangram.js');

module.exports = {
    load,
    create,
    update
}

var widgets = [];

function load (cm, configFile ){

    // Initialize array
    if (cm.widgets){
        // Clean widgets list
        while(cm.widgets.length > 0) {
            cm.widgets.pop();
        }
    } else {
        cm.widgets = [];
    }

    // Load JSON
    cm.widgets = JSON.parse(Utils.fetchHTTP(configFile))["widgets"];

    // Initialize tokens
    for (var i = 0; i < cm.widgets.length; i++){
        cm.widgets[i].token = YAMLTangram.addToken(cm.widgets[i]);
    }
}

function create (cm) {
    for (var nline = 0, size = cm.doc.size; nline < size; nline++) {
        var val = YAMLTangram.getValue(cm, nline);

        // If Line is significative
        if (/*getTag(cm, nline) !== "" &&*/ val !== "|" && val !== "" ) {

            // Check for widgets to add
            for (var i = 0; i < cm.widgets.length; i++) {
                var proto = cm.widgets[i];

                if (proto.token(scene, cm, nline)) {
                    var content = YAMLTangram.getValue(cm, nline);
                    var el;

                    switch(proto.type) {
                        case 'colorpicker':
                            el = createColorpickerWidget(cm, proto, content, nline);
                            break;
                        case 'togglebutton':
                            el = createToggleWidget(cm, proto, content, nline);
                            break;
                        case 'dropdownmenu':
                            el = createDropdownWidget(cm, proto, content, nline);
                            break;
                        case 'dropdownmenu-dynamic':
                            el = createDropdownDynamicWidget(cm, proto, content, nline);
                            break;
                        default:
                            // Nothing
                            break;
                    }

                    el.setAttribute('data-nline', nline); /* TODO: change */
                    widgets.push(el);
                }
            }
        }
    }

    setPositions(cm);
}

function createColorpickerWidget (cm, proto, content, nline) {
    var btn = document.createElement('div');
    btn.className = 'widget widget-colorpicker';
    btn.value = nline;
    btn.style.background = Utils.toCSS(content);
    btn.addEventListener('click', function (e) {
        var picker = new thistle.Picker(btn.style.background);

        var pos = Utils.getPosition(btn);
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

function setPositions (cm) {
    for (var i = 0, j = widgets.length; i < j; i++) {
        var el = widgets[i];
        var nline = parseInt(el.getAttribute('data-nline'), 10);
        if (cm.lineInfo(nline).handle){
            var chrpos = cm.lineInfo(nline).handle.text.length;
            cm.addWidget({ line: nline, ch: chrpos }, el);
        }
    }
}

function clear () {
    var widgets = document.getElementsByClassName('widget');
    while (widgets[0]) {
        widgets[0].parentNode.removeChild(widgets[0]);
    }
}

function clearWidget (widgetId) {

}

function update (cm) {
    clear();
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
