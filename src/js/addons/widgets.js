function loadWidgets(cm, configFile ){

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
    cm.widgets = JSON.parse(fetchHTTP(configFile))["widgets"];

    // Initialize tokens
    for (var i = 0; i < cm.widgets.length; i++){
        cm.widgets[i].token = addToken(cm.widgets[i]);
    }
}

//  TODO:
//          -- Replace global scene by a local
//
function addToken( tokenOBJ ){
    var token;
    if ( tokenOBJ['address'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['address'] ).test( getKeyAddress(cm, nLine) );
        };
    } else if ( tokenOBJ['key'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['key'] ).test( getKey(cm, nLine) );
        };
    } else if ( tokenOBJ['value'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['value'] ).test( getValue(cm, nLine) );
        };
    } else if ( tokenOBJ['content'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['content'] ).test( getKeySceneContent(scene, cm, nLine) );
        };
    } else {
        token = function(scene, cm, nLine) {
            return false;
        };
    }
    return token;
}

/* TODO: don't global */
var widgets = [];

function createWidgets (cm) {
    for (var nline = 0, size = cm.doc.size; nline < size; nline++) {
        var val = getValue(cm, nline);
        console.log(val);

        // If Line is significative
        if (getTag(cm, nline) !== "" && val !== "|" && val !== "" ) {

            // Check for widgets to add
            for (var i = 0; i < cm.widgets.length; i++) {
                var proto = cm.widgets[i];

                if (proto.token(scene, cm, nline)) {
                    var content = getValue(cm, nline);
                    var el;

                    switch(proto.type) {
                        case 'colorpicker':
                            el = createColorpickerWidget(proto, content, nline);
                            break;
                        case 'togglebutton':
                            el = createToggleWidget(proto, content, nline);
                            break;
                        case 'dropdownmenu':
                            el = createDropdownWidget(proto, content, nline);
                            break;
                        case 'dropdownmenu-dynamic':
                            el = createDropdownDynamicWidget(proto, content, nline);
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

    setWidgetPositions(cm);
}

function createColorpickerWidget (proto, content, nline) {
    var el = document.createElement('div');
    el.className = 'widget widget-colorpicker';
    el.value = nline;
    el.style.background = toCSS(content);
    el.setAttribute('onclick', 'colorPickerClicked(this)');
    return el;
}

function createToggleWidget (proto, content, nline) {
    var el = document.createElement('input');
    el.type = 'checkbox';
    el.className = 'widget widget-toggle';
    el.checked = (content === 'true') ? true : false;
    el.value = nline;
    el.setAttribute('onchange', 'toggleButton(this)');
    return el;
}

function createDropdownWidget (proto, content, nline) {
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

    el.setAttribute('onchange', 'dropdownMenuChange(this)');
    return el;
}

function createDropdownDynamicWidget (proto, content, nline) {
    var el = document.createElement('select');
    var obj = getAddressSceneContent(scene, proto.source);
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

    el.setAttribute('onchange', 'dropdownMenuChange(this)');
    return el;
}

function setWidgetPositions (cm) {
    for (var i = 0, j = widgets.length; i < j; i++) {
        var el = widgets[i];
        var nline = parseInt(el.getAttribute('data-nline'), 10);
        var chrpos = cm.lineInfo(nline).handle.text.length;
        cm.addWidget({ line: nline, ch: chrpos }, el);
    }
}

function clearWidgets () {
    var widgets = document.getElementsByClassName('widget');
    while (widgets[0]) {
        widgets[0].parentNode.removeChild(widgets[0]);
    }
}

function clearWidget (widgetId) {

}

function updateWidgets (cm) {
    clearWidgets();
    setWidgetPositions(cm);
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

//  TODO:
//          -- Replace global editor by local
//
function colorPickerClicked(div){
    var picker = new thistle.Picker(div.style.background);

    var pos = getPosition(div);
    picker.presentModal(pos.x+20,
                        editor.heightAtLine(parseInt(div.value))+20);

    picker.on('changed', function() {
        div.style.background = picker.getCSS();
        var color = picker.getRGB();
        var str = "["+ color.r.toFixed(3) + "," + color.g.toFixed(3) + "," + color.b.toFixed(3) + "]";
        setValue( editor, parseInt(div.value), str );
    });
}

function dropdownMenuChange(select) {
    setValue(   editor,
                parseInt(select.options[select.selectedIndex].value),
                select.options[select.selectedIndex].innerHTML );
}

function toggleButton(check) {
    setValue(   editor,
                parseInt(check.value),
                check.checked?"true":"false" );
}
