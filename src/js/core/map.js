import { saveAS } from "../vendor/FileSaver.min.js"

var take_screenshot = false;

export default class Map {
    constructor(tangram_play, place, style_file){
        let map_start_location = [0.0, 0.0, 3];

        // URL Parsing

        // leaflet-style URL hash pattern: ?style.yaml#[zoom],[lat],[lng]
        let url_hash = window.location.hash.slice(1).split('/');
        if (url_hash.length == 3) {
            map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
            // convert from strings
            map_start_location = map_start_location.map(Number);
        }

        // Create Leaflet map
        let map = L.map(place,
            { zoomControl: false },
            {'keyboardZoomOffset': .05}
        );
        L.control.zoom({position: 'topright'}).addTo(map);
        map.attributionControl.setPrefix('<a href="http://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a>');
        map.setView(map_start_location.slice(0, 2), map_start_location[2]);
        this.hash = new L.Hash(map);

        // Add Tangram Layer
        let layer = Tangram.leafletLayer({
            scene: style_file,
            postUpdate: postUpdate,
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
        }); 

        this.take_screenshot = false;

        window.layer = layer;
        window.scene = layer.scene;

        window.addEventListener('load', function () {
            layer.addTo(map);
        });

        this.leaflet = map;
        this.layer = layer;
        tangram_play.scene = layer.scene;
    };

    takeScreenshot() {
        if (!take_screenshot) {
            take_screenshot = true;
            this.layer.scene.requestRedraw();
        }
    }
};

function postUpdate() {
    if (take_screenshot == true) {
        // Adapted from: https://gist.github.com/unconed/4370822
        var image = scene.canvas.toDataURL('image/png').slice(22); // slice strips host/mimetype/etc.
        var data = atob(image); // convert base64 to binary without UTF-8 mangling
        var buf = new Uint8Array(data.length);
        for (var i = 0; i < data.length; ++i) {
            buf[i] = data.charCodeAt(i);
        }
        var blob = new Blob([buf], { type: 'image/png' });
        saveAs(blob, 'tangram-' + (+new Date()) + '.png'); // uses FileSaver.js: https://github.com/eligrey/FileSaver.js/

        take_screenshot = false;
    }
}
