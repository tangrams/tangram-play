import L from 'leaflet';
import 'leaflet-hash';
import { saveAs } from '../vendor/FileSaver.min.js';

import TangramPlay from '../tangram-play';
import LocalStorage from '../storage/localstorage';
import MapLoading from './loading';
import { initMapToolbar } from './toolbar';

export const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    maxZoom: 24,
    keyboardZoomOffset: 0.05
});

// Declare this export now, but Tangram is set up later. See initTangram() and loadScene().
export let tangram = null;

// Initializes Leaflet-based map
export function initMap () {
    // Get map start position
    const mapStartLocation = getMapStartLocation();

    // Create Leaflet map
    map.setView(mapStartLocation.latlng, mapStartLocation.zoom);
    const hash = new L.Hash(map);

    // Force Leaflet to update itself.
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

    initMapToolbar();
}

/**
 * Initializes Tangram
 * Tangram must be initialized with a scene file. Only initialize Tangram when
 * Tangram Play knows what scene to load, not before. See loadScene().
 */
function initTangram (pathToSceneFile) {
    // Add Tangram Layer
    tangram = window.Tangram.leafletLayer({
        scene: pathToSceneFile,
        attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
    });
    tangram.addTo(map);

    tangram.scene.subscribe({
        load: function (args) {
            // Hide loading indicator
            MapLoading.hide();
            TangramPlay.trigger('sceneupdate', args);
        }
    });

    TangramPlay.trigger('sceneinit');

    window.layer = tangram;
    window.scene = tangram.scene;
}

// Sends a scene path and base path to Tangram.
export function loadScene (pathToSceneFile, { reset = false, basePath = null } = {}) {
    // Initialize Tangram if it's not already set.
    // Tangram must be initialized with a scene file.
    // We only initialize Tangram when Tangram Play
    // knows what scene to load, not before.
    if (!tangram) {
        initTangram(pathToSceneFile);
    }
    else {
        // If scene is already set, re-use the internal path
        // If scene is not set, default to current path
        // This is ignored if reset is true; see below)
        const path = basePath || tangram.scene.config_path;
        // Preserve scene base path unless reset requested (e.g. reset on new file load)
        return tangram.scene.load(pathToSceneFile, !reset && path);
    }
}

/**
 * Uses Tangram's native screenshot functionality to download an image.
 * @public
 * @method
 * @requires FileSaver
 */
export function takeScreenshot () {
    tangram.scene.screenshot().then(function (result) {
        let slug = new Date().toString();

        // uses FileSaver.js: https://github.com/eligrey/FileSaver.js/
        saveAs(result.blob, `tangram-${slug}.png`);
    });
}

function getMapStartLocation () {
    // Set default location
    let startLocation = {
        latlng: [0.0, 0.0],
        zoom: 3
    };

    // URL Parsing
    // Leaflet-style URL hash pattern: ?scene.yaml#[zoom],[lat],[lng]
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

