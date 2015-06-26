// Get Querry string and parse it
var querry = parseQuery(window.location.search.slice(1));

var flags = parseFeatureFlags(querry);

if (flags['fullmenu'] === true) {
    document.querySelector('html').classList.add('full-menu');
}

if (isMobile()) {
  document.getElementById('mobile-message').style.display = 'block';
  document.getElementById('dismiss-mobile-message').addEventListener('click', function (e) {
    document.getElementById('mobile-message').style.display = 'none';
    reflowUI();
  })
}

// Tangram Map
var map = initMap( querry['style']? querry['style'] : "data/styles/basic.yaml" );

// Editor
var editor = initEditor(document.getElementById("editor"), querry['style']? querry['style'] : "data/styles/basic.yaml" );

//  UI
initUI(editor, map);

// Editor Widgets
loadWidgets(editor, "data/widgets.json");
loadKeys(editor, "data/keys.json");

// Once everything is loaded
setTimeout( function (){

    if (querry['foldLevel']) unfoldAll(editor); foldByLevel(editor,parseInt(querry['foldLevel']));
    if (querry['lines']) selectLines(editor,querry['lines']);

    updateWidgets(editor);

}, 500);
