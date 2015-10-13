'use strict';

import LocalStorage from 'app/addons/LocalStorage';
import { map, container } from 'app/TangramPlay';
import search from 'app/addons/map/search';
import geolocator from 'app/addons/map/geolocator';
import bookmarks from 'app/addons/map/bookmarks';

const STORAGE_DISPLAY_KEY = 'map-toolbar-display';
const MAP_UPDATE_DELTA = 0.002;

let el;
let currentLocation;

const MapToolbar = {
    init () {
        el = container.querySelector('.tp-map-toolbar');
        search.init();
        geolocator.init();
        bookmarks.init();

        setupEventListeners();
        setInitialDisplayState();
        setZoomLabel();
        search.setCurrentLocation();

        currentLocation = map.getCenter();
    },

    toggle () {
        if (el.getBoundingClientRect().top > 0) {
            hideToolbar();
        }
        else {
            showToolbar();
        }
    }
};

export default MapToolbar;

function setupEventListeners () {
    el.querySelector('#zoom-in').addEventListener('click', e => {
        map.zoomIn(1, { animate: true });
        setZoomLabel();
    }, false);
    el.querySelector('#zoom-out').addEventListener('click', e => {
        map.zoomOut(1, { animate: true });
        setZoomLabel();
    }, false);

    // Close
    el.querySelector('.tp-map-toolbar-toggle').addEventListener('click', e => {
        hideToolbar();
    });

    // Make sure that map zoom label changes when the map is done zooming
    map.on('zoomend', function (e) {
        setZoomLabel();
    });
    map.on('moveend', function (e) {
        // Only update location if the map center has moved more than a given delta
        // This is actually really necessary because EVERY update in the editor reloads
        // the map, which fires moveend events despite not actually moving the map
        // But we also have the bonus of not needing to make a reverse geocode request
        // for small changes of the map center.
        let center = map.getCenter();
        if (getMapUpdateDelta(currentLocation, center) > MAP_UPDATE_DELTA) {
            search.setCurrentLocation();
            // Reset currentLocation after geocoding - don't reset after every
            // moveend because this basically allows the reverse geocode to never
            // happen if you just scoot the viewport tiny amounts each time.
            currentLocation = center;
        }
    });
}

function showToolbar () {
    el.style.top = '0';
    saveDisplayState('true');
}

function hideToolbar () {
    el.style.top = '-50px';
    saveDisplayState('false');
}

function saveDisplayState (isShown = 'true') {
    LocalStorage.setItem(STORAGE_DISPLAY_KEY, isShown);
}

function setInitialDisplayState () {
    let storedPosition = LocalStorage.getItem(STORAGE_DISPLAY_KEY);
    // LocalStorage saves a string rather than actual boolean value
    if (storedPosition && storedPosition === 'false') {
        hideToolbar();
    }
    // show toolbar by default
    else {
        showToolbar();
    }
}

function setZoomLabel () {
    let label = el.querySelector('.tp-map-zoom-quantity');
    let currentZoom = map.getZoom();
    let fractionalNumber = Math.floor(currentZoom * 10) / 10;
    label.textContent = fractionalNumber.toFixed(1);
}

function getMapUpdateDelta (startLatLng, endLatLng) {
    let startX = startLatLng.lat;
    let startY = startLatLng.lng;
    let endX = endLatLng.lat;
    let endY = endLatLng.lng;
    return Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2))
}
