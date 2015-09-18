'use strict';

import { map, container } from 'app/TangramPlay';
import { httpGet, debounce } from 'app/core/common';

const PELIAS_KEY = 'pelias-HC34Gr4';
const PELIAS_HOST = 'pelias.mapzen.com';
let input;
let latlngLabel;
let latlng;
let location;

function init () {
    // Cache reference to input element
    input = container.querySelector('.tp-map-search-input');
    latlngLabel = container.querySelector('.tp-map-latlng-label');
    input.addEventListener('keyup', onInputHandler, false);
}

function setCurrentLocation () {
    latlng = map.getCenter();
    latlngLabel.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    reverseGeocode(latlng);
}

function reverseGeocode (latlng) {
    let lat = latlng.lat;
    let lng = latlng.lng;
    let endpoint = `//${PELIAS_HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&api_key=${PELIAS_KEY}`;

    debounce(httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }

        // TODO: Much more clever viewport/zoom based determination of current location
        let response = JSON.parse(res);
        location = response.features[0].properties.label;

        if (location) {
            input.placeholder = `${location}`;
        } else {
            input.placeholder = '???';
        }
    }), 300);
}

function onInputHandler (event) {
    let query = input.value.trim();
    if (query.length < 2) {
        return;
    }

    let center = map.getCenter();
    let endpoint = `//${PELIAS_HOST}/v1/search?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&api_key=${PELIAS_KEY}`;

    httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log(res);
        }
    });
}

export default {
    init,
    setCurrentLocation
}
