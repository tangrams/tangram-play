'use strict';

import Geolocator from 'app/addons/ui/Geolocator';
import TangramPlay from 'app/TangramPlay';

let el;
let map;

export default class MapNavigation {
    constructor () {
        el = this.el = document.getElementById('map-nav');
        map = this.map = TangramPlay.map.leaflet;
        this.setupEventListeners();

        new Geolocator();

        setZoomLabel();
    }

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

        // Make sure that map zoom label changes when the map is done zooming
        map.on('zoomend', function (e) {
            setZoomLabel();
        })
    }

    setZoomLabel () {

    }
}

function setZoomLabel () {
    let label = el.querySelector('.tp-map-zoom-indicator');
    let currentZoom = map.getZoom();
    label.textContent = 'z' + Math.floor(currentZoom);
}
