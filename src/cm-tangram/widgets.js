var widgets = [];

function loadWidgets( configFile ){
    var widgets_data = JSON.parse(fetchHTTP(configFile));

    for (var i = 0; i < widgets_data["widgets"].length; i++){
        var obj = {};
        obj.type = widgets_data["widgets"][i].type;
        obj.token = addWidgetToken(widgets_data["widgets"][i]);

        if ( obj.type === "dropdownmenu" ){
            obj.options = widgets_data["widgets"][i].options;
        }

        widgets.push( obj );
    }
}

function addWidgetToken( widgetOBJ ){
    var token;
    if ( widgetOBJ['address'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['address'] ).test( getTagAddress(cm, nLine) );
        };
    } else if ( widgetOBJ['tag'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['tag'] ).test( getTag(cm, nLine) );
        };
    } else if ( widgetOBJ['value'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['value'] ).test( getValue(cm, nLine) );
        };
    } else if ( widgetOBJ['content'] ){
        token = function(scene, cm, nLine) {
            return RegExp( widgetOBJ['content'] ).test( getTagCompleteContent(scene, cm, nLine) );
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
            // Chech for Colors
            for (var i = 0; i < widgets.length; i++){
                if ( widgets[i].token(scene,cm,nline) ){
                    var content = getValue(cm, nline);

                    if (widgets[i].type === "colorpicker"){
                        var btn = document.createElement("div");
                        btn.style.zIndex = "10";
                        btn.style.background = toCSS(content);   
                        btn.className = "widget";
                        btn.style.border = "1px solid #A8ABAA";
                        btn.style.borderRadius = "4px";
                        btn.value = nline;
                        btn.setAttribute('onclick','colorPickerClicked(this)');
                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, btn);
                        btn.style.top = (parseInt(btn.style.top, 10) - 17)+"px";
                        btn.style.left = (parseInt(btn.style.left, 10) + 5)+"px";
                        btn.style.width = "17px";
                        btn.style.height = "17px";
                        break;

                    } else if (widgets[i].type === "dropdownmenu"){

                        var list = document.createElement('Select');
                        list.className = "widget";
                        list.style.zIndex = "10";

                        var selected = -1;
                        for (var j = 0; j < widgets[i].options.length ; j++ ){
                            var newOption = document.createElement("option");
                            newOption.value = nline;
                            if (content === widgets[i].options[j]) {
                                newOption.selected = true;
                            }
                            newOption.innerHTML= widgets[i].options[j];
                            list.appendChild(newOption);
                        }

                        cm.addWidget({line:nline, ch:cm.lineInfo(nline).handle.text.length }, list);
                        list.style.top = (parseInt(list.style.top, 10) - 17)+"px";
                        list.style.left = (parseInt(list.style.left, 10) + 5)+"px";
                        list.setAttribute('onchange','dropdownMenuChange(this)');
                        break;

                    } else if (widgets[i].type === "togglebutton"){
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
                    }

                }
            }
        }
    }
}

function colorPickerClicked(div){

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