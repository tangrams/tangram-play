'use strict';

import { map, container } from 'app/TangramPlay';
import { httpGet, debounce } from 'app/core/common';

const PELIAS_KEY = 'pelias-HC34Gr4';
const PELIAS_HOST = 'pelias.mapzen.com';
let input;
let latlngLabel;
let latlng;
let resultsEl;
let currentLocation;

function init () {
    // Cache reference to input element
    input = container.querySelector('.tp-map-search-input');
    latlngLabel = container.querySelector('.tp-map-latlng-label');
    resultsEl = container.querySelector('.tp-map-search-results');
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
    let endpoint = `//${PELIAS_HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&layers=coarse&api_key=${PELIAS_KEY}`;

    debounce(httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }

        // TODO: Much more clever viewport/zoom based determination of current location
        let response = JSON.parse(res);
        currentLocation = response.features[0].properties.label;

        if (currentLocation) {
            input.placeholder = `${currentLocation}`;
        }
        else {
            input.placeholder = '???';
        }
    }), 300);
}

function onInputHandler (event) {
    let query = input.value.trim();
    if (query.length < 2) {
        clearResults();
        return;
    }

    let center = map.getCenter();
    let endpoint = `//${PELIAS_HOST}/v1/search?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${PELIAS_KEY}`;

    debounce(httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            showResults(JSON.parse(res));
        }
    }), 300);
}

function showResults (results) {
    var features = results.features;

    if (features.length === 0) {
        return;
    }

    // Reset and display results container
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'block';

    var listEl = document.createElement('ul');
    listEl.className = 'tp-map-search-results-list';
    resultsEl.appendChild(listEl);

    for (var i = 0, j = features.length; i < j; i++) {
        var feature = features[i];
        var resultItem = document.createElement('li');
        resultItem.className = 'tp-map-search-result';
        resultItem.coords = feature.geometry.coordinates;
        resultItem.innerHTML += '<i class="btb bt-map-marker"></i> ' + highlight(feature.properties.label, input.value.trim());
        listEl.appendChild(resultItem);
    }

    container.addEventListener('click', _onClickOutsideDropdown, false);
}

function clearResults () {
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'none';
}

function clearInput () {
    input.value = '';
}

function _onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('tp-map-search')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('tp-map-search')) {
        clearResults();
        clearInput();
        container.removeEventListener('click', _onClickOutsideDropdown, false);
    }
}

function highlight (text, focus) {
    var r = new RegExp('(' + focus + ')', 'gi');
    return text.replace(r, '<strong>$1</strong>');
}

export default {
    init,
    setCurrentLocation
};
