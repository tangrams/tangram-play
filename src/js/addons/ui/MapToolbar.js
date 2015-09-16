'use strict';

import Geolocator from 'app/addons/ui/Geolocator';
import TangramPlay from 'app/TangramPlay';

let el;
let map;

const MapToolbar = {
    init () {
        el = this.el = document.getElementById('map-toolbar');
        map = this.map = TangramPlay.map.leaflet;
        this.setupEventListeners();

        new Geolocator();

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
        })

        // Close
        this.el.querySelector('.tp-map-toolbar-toggle').addEventListener('click', e => {
            hideToolbar();
        })

        // Make sure that map zoom label changes when the map is done zooming
        map.on('zoomend', function (e) {
            setZoomLabel();
        })
    },

    toggle () {
        if (el.getBoundingClientRect().top > 0) {
            hideToolbar();
        }
        else {
            showToolbar();
        }
    }
}

export default MapToolbar;

function showToolbar () {
    el.style.top = '0';
}

function hideToolbar () {
    el.style.top = '-50px';
}

function setZoomLabel () {
    let label = el.querySelector('.tp-map-zoom-indicator');
    let currentZoom = map.getZoom();
    let fractionalNumber = Math.round(currentZoom * 10) / 10
    label.innerHTML = 'z&#8202;' + fractionalNumber.toFixed(1).toString();
}
