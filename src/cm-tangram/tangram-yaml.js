
// Check if a line is commented
//
function getLineTag(cm, nLine){
    if (nLine >= 0){
        var regex = /^\s*(\w+):/gm;
        var tags = ( regex.exec(cm.lineInfo(nLine).text) || []);
        // console.log(tags);
        if (tags.length > 0){
            return { 'line': nLine, 'name' : tags[1] };
        } else {
            return getLineTag(cm, nLine-1);
        }
    }  
}

//  Get Parent line according to indentation
//
function getParentLine(cm, nLine){
    var level = getIndLevel(cm,nLine);
    for (var i = nLine-1; i >= 0; i--){
        if ( !isEmpty(cm, i) && getIndLevel(cm,i) === level-1 ){
            return i;
        }
    }
    return nLine;
}

//  Get array of YAML tags parent tree of a particular line in inverse order 
//
function getInverseTags(cm, nLine){
    var tags = [];
    var line = nLine;
    var level = 1;
    while (level > 0){
        var tag = getLineTag(cm,line);

        // Prevent errors
        if (tag.name){
            tags.push(tag.name);
            level = getIndLevel(cm,tag.line);
            var parentLine = getParentLine(cm,tag.line);
            line = parentLine;
        } else {
            return tags;
        }
    }
    return tags;
}

// Get array of YAML tags parent tree of a particular line
//
function getTags(cm, nLine) {
    var invTags = getInverseTags(cm, nLine);
    var tags = [];
    for (var i = invTags.length-1; i >= 0; i--){
        tags.push(invTags[i]);
    }
    return tags;
}

// Get the YAML content a specific series of tags (array of strings)
//
function getYAMLContent(sceneConfig, tags){
    var tmp = sceneConfig[ tags[0] ];
    for (var i = 1; i < tags.length; i++){
        if (tmp[ tags[i] ]){
            tmp = tmp[ tags[i] ];
        } else {
            return tmp;
        }
    }
    return tmp;
}

// Make an folder style address from an array of tags
//
function tagsToAddress(tags){
    var address = "";
    for ( var i = 0; i < tags.length; i++){
        address += "/" + tags[i] ;
    }
    return address;
}

//  Function that check if a line is inside a Color Shader Block
//
function getColorBlockShader(cm, nLine) {
    var invTags = getInverseTags(cm, nLine)
    var address = tagsToAddress( invTags );

    // console.log(address); 
    // console.log(address.indexOf("/color/blocks/shaders/"));
    if (address.indexOf("/color/blocks/shaders/") === 0){
        var styleName = invTags[3];
        // console.log(styleName);
        var style = scene.styles[styleName];
        if (style){
            return style["shaders"];
        } else {
            return {};
        }
    } else {
        return {};
    }
}
