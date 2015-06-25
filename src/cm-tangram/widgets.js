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
            return RegExp( tokenOBJ['address'] ).test( getTagAddress(cm, nLine) );
        };
    } else if ( tokenOBJ['tag'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['tag'] ).test( getTag(cm, nLine) );
        };
    } else if ( tokenOBJ['value'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['value'] ).test( getValue(cm, nLine) );
        };
    } else if ( tokenOBJ['content'] ){
        token = function(scene, cm, nLine) {
            return RegExp( tokenOBJ['content'] ).test( getTagCompleteContent(scene, cm, nLine) );
        };
    } else {
        token = function(scene, cm, nLine) {
            return false;
        };
    }
    return token;
}

function updateWidgets(cm){
    var colorpickers = document.getElementsByClassName("widget");
    for (var i = colorpickers.length-1; i >=0 ; i--){
        colorpickers[i].parentNode.removeChild(colorpickers[i]);
    }

    for (var nline = 0; nline < cm.doc.size; nline++){    
        var val = getValue(cm,nline);

        // If Line is significative
        if (getTag(cm,nline) !== "" && val !== "|" && val !== "" ){

            // Chech for widgets to add
            for (var i = 0; i < cm.widgets.length; i++){
                if ( cm.widgets[i].token(scene,cm,nline) ){
                    var content = getValue(cm, nline);

                    if (cm.widgets[i].type === "colorpicker"){
                        var colorBtn = document.createElement("div");
                        colorBtn.style.zIndex = "10";
                        colorBtn.style.background = toCSS(content);   
                        colorBtn.className = "widget";
                        colorBtn.style.border = "1px solid #A8ABAA";
                        colorBtn.style.borderRadius = "4px";
                        colorBtn.value = nline;
                        colorBtn.setAttribute('onclick','colorPickerClicked(this)');
                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, colorBtn);
                        colorBtn.style.top = (parseInt(colorBtn.style.top, 10) - 17)+"px";
                        colorBtn.style.left = (parseInt(colorBtn.style.left, 10) + 5)+"px";
                        colorBtn.style.width = "17px";
                        colorBtn.style.height = "17px";
                        break;

                    } else if (cm.widgets[i].type === "togglebutton"){
                        var check = document.createElement('Input');
                        check.type = 'checkbox';
                        check.className = "widget";
                        check.style.zIndex = "10";
                        check.value = nline;
                        check.checked = getValue(cm,nline) === "true" ? true : false;
                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, check);
                        check.style.top = (parseInt(check.style.top, 10) - 17)+"px";
                        check.style.left = (parseInt(check.style.left, 10) + 5)+"px";
                        check.setAttribute('onchange','toggleButton(this)');
                        break;
                    } else if (cm.widgets[i].type === "dropdownmenu"){

                        var list = document.createElement('Select');
                        list.className = "widget";
                        list.style.zIndex = "10";

                        for (var j = 0; j < cm.widgets[i].options.length ; j++ ){
                            var newOption = document.createElement("option");
                            newOption.value = nline;
                            if (content === cm.widgets[i].options[j]) {
                                newOption.selected = true;
                            }
                            newOption.innerHTML= cm.widgets[i].options[j];
                            list.appendChild(newOption);
                        }

                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, list);
                        list.style.top = (parseInt(list.style.top, 10) - 17)+"px";
                        list.style.left = (parseInt(list.style.left, 10) + 5)+"px";
                        list.setAttribute('onchange','dropdownMenuChange(this)');
                        break;

                    } else if (cm.widgets[i].type === "dropdownmenu-dynamic"){

                        var list = document.createElement('Select');
                        list.className = "widget";
                        list.style.zIndex = "10";

                        var obj = getAddressSceneContent(scene,cm.widgets[i].source);
                        var keys = obj? Object.keys(obj) : {};

                        if (cm.widgets[i].options){
                            for (var j = 0; j < cm.widgets[i].options.length ; j++ ){
                                var newOption = document.createElement("option");
                                newOption.value = nline;
                                if (content === cm.widgets[i].options[j]) {
                                    newOption.selected = true;
                                }
                                newOption.innerHTML= cm.widgets[i].options[j];
                                list.appendChild(newOption);
                            }
                        }
                        
                        for (var j = 0; j < keys.length ; j++ ){
                            var newOption = document.createElement("option");
                            newOption.value = nline;
                            if (content === keys[j]) newOption.selected = true;
                            newOption.innerHTML= keys[j];
                            list.appendChild(newOption);
                        }

                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, list);
                        list.style.top = (parseInt(list.style.top, 10) - 17)+"px";
                        list.style.left = (parseInt(list.style.left, 10) + 5)+"px";
                        list.setAttribute('onchange','dropdownMenuChange(this)');
                        break;

                    } 

                }
            }
        }
    }
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