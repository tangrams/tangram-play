'use strict';

import Geolocator from 'app/addons/ui/Geolocator';
import TangramPlay from 'app/TangramPlay';
import LocalStorage from 'app/addons/LocalStorage';

let el;
let map;

const STORAGE_DISPLAY_KEY = 'map-toolbar-display';

const MapToolbar = {
    init () {
        el = this.el = document.getElementById('map-toolbar');
        map = this.map = TangramPlay.map.leaflet;
        this.setupEventListeners();

        new Geolocator();

        setInitialDisplayState();
        setZoomLabel();
    },

    setupEventListeners () {
        this.el.querySelector('#zoom-in').addEventListener('click', e => {
            this.map.zoomIn(1, { animate: true });
            setZoomLabel();
        }, false);
        this.el.querySelector('#zoom-out').addEventListener('click', e => {
            this.map.zoomOut(1, { animate: true });
            setZoomLabel();
        }, false);
        this.el.querySelector('.tp-map-search-icon').addEventListener('click', e => {
            this.el.querySelector('.tp-map-search-input').focus();
        });

        // Close
        this.el.querySelector('.tp-map-toolbar-toggle').addEventListener('click', e => {
            hideToolbar();
        });

        // Make sure that map zoom label changes when the map is done zooming
        map.on('zoomend', function (e) {
            setZoomLabel();
        });
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
    let label = el.querySelector('.tp-map-zoom-indicator');
    let currentZoom = map.getZoom();
    let fractionalNumber = Math.round(currentZoom * 10) / 10;
    label.innerHTML = 'z&#8202;' + fractionalNumber.toFixed(1).toString();
}
