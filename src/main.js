// Get query string and parse it
var query = parseQuery(window.location.search.slice(1));

var flags = parseFeatureFlags(query);

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
var map = initMap( query['style']? query['style'] : "data/styles/basic.yaml" );

// Editor
var editor = initEditor(document.getElementById("editor"), query['style']? query['style'] : "data/styles/basic.yaml" );

//  UI
initUI(editor, map);

// Editor Widgets
loadWidgets(editor, "data/widgets.json");
loadKeys(editor, "data/keys.json");

// Once everything is loaded
setTimeout( function (){

    if (query['foldLevel']) unfoldAll(editor); foldByLevel(editor,parseInt(query['foldLevel']));
    if (query['lines']) selectLines(editor,query['lines']);

    updateWidgets(editor);

}, 500);
