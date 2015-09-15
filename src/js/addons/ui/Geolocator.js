// (c) 2015 Mapzen
//
// MAP UI · GEOLOCATOR
//
// "Locate me" button for demos
// ----------------------------------------------------------------------------
'use strict';

import TangramPlay from 'app/TangramPlay';

const GEOLOCATOR_TITLE_TEXT = 'Get current location';

export default class Geolocator {
    constructor () {
        this.el = _createEl();
        this.el.querySelector('.tp-geolocator-icon').addEventListener('click', (e) => {
            if (e.target.classList.contains('tp-geolocator-active')) {
                return false;
            }
            e.target.classList.add('tp-geolocator-active');
            this.getCurrentLocation(this.onGeolocateSuccess.bind(this), this.onGeolocateError.bind(this));
        });

        // Tangram play map container overrides
        // TODO: this better
        document.getElementById('map-nav').appendChild(this.el);
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

        TangramPlay.map.leaflet.setView([latitude, longitude], 14);
        this.resetGeolocateButton();
    }

    onGeolocateError (err) {
        console.log(err);
        window.alert('Unable to retrieve current position. Geolocation may be disabled on this browser or unavailable on this system.');
        this.resetGeolocateButton();
    }

    resetGeolocateButton () {
        const button = this.el.querySelector('.tp-geolocator-icon');
        button.classList.remove('tp-geolocator-active');
    }
}

function _createEl () {
    // Create geolocator
    let el = document.createElement('div');
    let buttonEL = document.createElement('div');
    let iconEl = document.createElement('span');

    iconEl.className = 'tp-geolocator-icon';

    buttonEL.className = 'tp-geolocator-button';
    buttonEL.setAttribute('title', GEOLOCATOR_TITLE_TEXT);
    buttonEL.appendChild(iconEl);

    el.className = 'tp-geolocator';
    el.appendChild(buttonEL);

    return el;
}
