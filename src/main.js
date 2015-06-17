// Get Querry string and parse it
var querry = parseQuery(window.location.search.slice(1));

// Tangram Map
var map = initMap( querry['style']? querry['style'] : "data/default.yaml" );

// Editor
var editor = initEditor(document.getElementById("editor"), querry['style']? querry['style'] : "data/default.yaml" );

//  UI
initUI(editor, map);

// Editor Widgets
loadWidgets("data/widgets.json");

// Once everything is loaded
setTimeout(function () {

    if (querry['foldLevel']) unfoldAll(editor); foldByLevel(editor,parseInt(querry['foldLevel']));
    if (querry['lines']) selectLines(editor,querry['lines']);

    updateWidgets(editor);

}, 1000);
