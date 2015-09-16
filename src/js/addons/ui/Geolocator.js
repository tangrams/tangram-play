// (c) 2015 Mapzen
//
// MAP UI · GEOLOCATOR
//
// "Locate me" button for demos
// ----------------------------------------------------------------------------
'use strict';

import TangramPlay from 'app/TangramPlay';

export default class Geolocator {
    constructor () {
        this.el = document.getElementById('tp-geolocator');
        this.el.addEventListener('click', (e) => {
            if (this.el.classList.contains('tp-geolocator-active')) {
                return false;
            }
            this.el.classList.add('tp-geolocator-active');
            this.getCurrentLocation(this.onGeolocateSuccess.bind(this), this.onGeolocateError.bind(this));
        });
        this.map = TangramPlay.map.leaflet;
    }

    getCurrentLocation (success, error) {
        const geolocator = window.navigator.geolocation;
        const options = {
            enableHighAccuracy: true,
            maximumAge: 10000,
        };

        if (geolocator) {
            // Fixes an infinite loop bug with Safari
            // https://stackoverflow.com/questions/27150465/geolocation-api-in-safari-8-and-7-1-keeps-asking-permission/28436277#28436277
            window.setTimeout(() => {
                geolocator.getCurrentPosition(success, error, options);
            }, 0);
        }
        else {
            this.el.style.display = 'none';
            console.log('Browser does not support geolocation');
        }
    }

    onGeolocateSuccess (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Zoom in a bit only if user's view is very zoomed out
        let zoom = (this.map.getZoom() < 16) ? 16 : this.map.getZoom();

        this.map.setView([latitude, longitude], zoom);
        this.resetGeolocateButton();
    }

    onGeolocateError (err) {
        console.log(err);
        window.alert('Unable to retrieve current position. Geolocation may be disabled on this browser or unavailable on this system.');
        this.resetGeolocateButton();
    }

    resetGeolocateButton () {
        this.el.classList.remove('tp-geolocator-active');
    }
}
