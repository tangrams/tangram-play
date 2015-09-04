'use strict';

import TangramPlay from 'app/TangramPlay';

import LocalStorage from 'app/addons/LocalStorage';
import { saveAs } from 'app/vendor/FileSaver.min.js';
import MapLoading from 'app/addons/ui/MapLoading';

//import L from 'leaflet';
import 'leaflet-hash';

let takeScreenshot = false;

export default class Map {
    constructor(place, styleFile) {
        // Get map start position
        let mapStartLocation = _getMapStartLocation();

        // Create Leaflet map
        let map = L.map(place,
            { zoomControl: false },
            { keyboardZoomOffset: 0.05 }
        );
        L.control.zoom({ position: 'topright' }).addTo(map);
        map.attributionControl.setPrefix('<a href="http://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a>');
        map.setView(mapStartLocation.latlng, mapStartLocation.zoom);
        this.hash = new L.Hash(map);

        // Add Tangram Layer
        let layer = window.Tangram.leafletLayer({
            scene: styleFile,
            postUpdate: postUpdate,
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
        });
        layer.addTo(map);

        this.takeScreenshot = false;

        // Debug access
        window.Lmap = map;
        window.layer = layer;
        window.scene = layer.scene;

        // Force Leaflet update itself.
        // This resolves an issue where the map may sometimes not appear
        // or only partially appear when this app is first loaded.
        window.setTimeout(function () {
            map.invalidateSize(false);
        }, 0);

        // Set up a listener to record current map view settings when user leaves
        window.addEventListener('unload', function (event) {
            LocalStorage.setItem('latitude', map.getCenter().lat);
            LocalStorage.setItem('longitude', map.getCenter().lng);
            LocalStorage.setItem('zoom', map.getZoom());
        });

        this.leaflet = map;
        this.layer = layer;
        this.scene = layer.scene;
    }

    takeScreenshot() {
        if (!takeScreenshot) {
            takeScreenshot = true;
            this.layer.scene.requestRedraw();
        }
    }
}

function _getMapStartLocation () {
    // Set default location
    let startLocation = {
        latlng: [0.0, 0.0],
        zoom: 3
    };

    // URL Parsing
    // Leaflet-style URL hash pattern: ?style.yaml#[zoom],[lat],[lng]
    let urlHash = window.location.hash.slice(1).split('/');
    if (urlHash.length === 3) {
        // Convert from strings
        urlHash = urlHash.map(Number);

        startLocation = {
            latlng: [urlHash[1], urlHash[2]],
            zoom: urlHash[0]
        };
    }
    // If no valid URL hash is provided, check localStorage to see if
    // lat & lng & zoom have been saved from a previous session
    else {
        let previousLat = Number(LocalStorage.getItem('latitude'));
        let previousLng = Number(LocalStorage.getItem('longitude'));
        let previousZoom = Number(LocalStorage.getItem('zoom'));
        if (previousLat && previousLng && previousZoom) {
            startLocation = {
                latlng: [previousLat, previousLng],
                zoom: previousZoom
            };
        }
    }

    return startLocation;
}

function postUpdate() {
    // Hide loading indicator
    MapLoading.hide();

    if (takeScreenshot) {
        // Adapted from: https://gist.github.com/unconed/4370822
        let image = TangramPlay.map.scene.canvas.toDataURL('image/png').slice(22); // slice strips host/mimetype/etc.
        let data = atob(image); // convert base64 to binary without UTF-8 mangling
        let buf = new Uint8Array(data.length);
        for (let i = 0; i < data.length; ++i) {
            buf[i] = data.charCodeAt(i);
        }
        let blob = new Blob([buf], { type: 'image/png' });
        saveAs(blob, 'tangram-' + (new Date()).toString() + '.png'); // uses FileSaver.js: https://github.com/eligrey/FileSaver.js/

        takeScreenshot = false;
    }
}
