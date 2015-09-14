'use strict';

import Geolocator from 'app/addons/ui/Geolocator';
import TangramPlay from 'app/TangramPlay';

export default class MapNavigation {
    constructor () {
        this.el = document.getElementById('map-nav');
        this.map = TangramPlay.map.leaflet;
        this.setupEventListeners();

        new Geolocator();
    }

    setupEventListeners () {
        this.el.querySelector('#zoom-in').addEventListener('click', e => {
            this.map.zoomIn(1, { animate: true });
        }, false);
        this.el.querySelector('#zoom-out').addEventListener('click', e => {
            this.map.zoomOut(1, { animate: true });
        }, false);
    }
}
