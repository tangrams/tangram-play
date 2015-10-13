'use strict';

import TangramPlay from 'app/TangramPlay';
import { map, container } from 'app/TangramPlay';
import { httpGet, debounce } from 'app/core/common';
import bookmarks from 'app/addons/map/bookmarks';

const PELIAS_KEY = 'search-xFAc9NI';
const PELIAS_HOST = 'search.mapzen.com';
const PELIAS_THROTTLE = 300; // in ms, time to wait before repeating a request

let searchEl;
let input;
let latlng;
let latlngLabel;
let latlngLabelPrecision = 4;
let resultsEl;
let saveEl;
let maxReqTimestampRendered = new Date().getTime();

function init () {
    // Cache reference to elements
    searchEl = container.querySelector('.tp-map-search');
    input = searchEl.querySelector('.tp-map-search-input');
    latlngLabel = searchEl.querySelector('.tp-map-latlng-label');
    resultsEl = searchEl.querySelector('.tp-map-search-results');
    saveEl = searchEl.querySelector('.tp-map-save-icon');

    input.addEventListener('keyup', onInputKeyupHandler, false);
    input.addEventListener('keydown', onInputKeydownHandler, false);
    input.addEventListener('focus', onInputFocusHandler, false);
    resultsEl.addEventListener('click', onResultsClickHandler, false);
    saveEl.addEventListener('click', onSaveClickHandler, false);

    searchEl.querySelector('.tp-map-search-icon').addEventListener('click', e => {
        input.focus();
    });

    TangramPlay.on('resize', onDividerMove);
}

function setCurrentLocation () {
    latlng = map.getCenter();
    latlngLabel.textContent = `${latlng.lat.toFixed(latlngLabelPrecision)}, ${latlng.lng.toFixed(latlngLabelPrecision)}`;

    // Does not update location if the no-update flag is false
    // This is used to prevent an unnecessary additional request to Pelias
    if (input.dataset.noUpdate !== 'true') {
        reverseGeocode(latlng);

        // Reset save icon
        // TODO: Be smarter about when this happens
        resetSaveIcon();
    }
    input.dataset.noUpdate = false;
}

function reverseGeocode (latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    const endpoint = `//${PELIAS_HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&layers=coarse&api_key=${PELIAS_KEY}`;

    debounce(httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }

        // TODO: Much more clever viewport/zoom based determination of current location
        let response = JSON.parse(res);
        if (!response.features || response.features.length === 0) {
            // Sometimes reverse geocoding returns no results
            input.placeholder = 'Unknown location';
        }
        else {
            input.placeholder = response.features[0].properties.label;
        }
    }), PELIAS_THROTTLE);
}

function onInputKeyupHandler (event) {
    const key = event.which || event.keyCode;
    const query = input.value.trim();
    if (query.length < 2) {
        clearResults();
        return;
    }

    // Ignore all further action if the keycode matches an arrow
    // key (handled via keydown event)
    if (key === 38 || key === 40) {
        return;
    }

    // keyCode 27 = esc key (esc should clear results)
    if (key === 27) {
        input.blur();
        clearInput();
        clearResults();
        return;
    }

    // keyCode 13 = enter key (runs search query instead of autocomplete)
    if (key === 13) {
        search(query);
        return;
    }

    autocomplete(query);
}

function onInputKeydownHandler (event) {
    const key = event.which || event.keyCode;

    const list = resultsEl.querySelectorAll('.tp-map-search-result');
    const selected = resultsEl.querySelector('.tp-map-search-active');
    let selectedPosition;

    for (let i = 0; i < list.length; i++) {
        if (list[i] === selected) {
            selectedPosition = i;
            break;
        }
    }

    switch (key) {
        // 13 = enter
        case 13:
            event.preventDefault();
            if (selected) {
                gotoSelectedResult(selected);
            }
            break;
        // 38 = up arrow
        case 38:
            event.preventDefault();

            // Ignore key if there are no results or if list is not visible
            if (!list || resultsEl.style.display === 'none') {
                return;
            }

            if (selected) {
                selected.classList.remove('tp-map-search-active');
            }

            let previousItem = list[selectedPosition - 1];

            if (selected && previousItem) {
                previousItem.classList.add('tp-map-search-active');
            }
            else {
                list[list.length - 1].classList.add('tp-map-search-active');
            }
            break;
        // 40 = down arrow
        case 40:
            event.preventDefault();

            // Ignore key if there are no results or if list is not visible
            if (!list || resultsEl.style.display === 'none') {
                return;
            }

            if (selected) {
                selected.classList.remove('tp-map-search-active');
            }

            let nextItem = list[selectedPosition + 1];

            if (selected && nextItem) {
                nextItem.classList.add('tp-map-search-active');
            }
            else {
                list[0].classList.add('tp-map-search-active');
            }
            break;
        // all other keys
        default:
            break;
    }
}

// Reruns query if input is focused while there is still input in there
function onInputFocusHandler (event) {
    const query = input.value.trim();
    if (query.length >= 2) {
        autocomplete(query);
    }
}

let makeRequest = debounce(function (endpoint) {
    httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            showResults(JSON.parse(res));
        }
    });
}, PELIAS_THROTTLE);

// Get autocomplete suggestions
function autocomplete (query) {
    const center = map.getCenter();
    const endpoint = `//${PELIAS_HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${PELIAS_KEY}`;
    makeRequest(endpoint);
}

// Get search results
function search (query) {
    const center = map.getCenter();
    const endpoint = `//${PELIAS_HOST}/v1/search?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${PELIAS_KEY}`;
    makeRequest(endpoint);
}

function onResultsClickHandler (event) {
    let selected = event.target;

    const findParent = function () {
        if (selected && selected.nodeName !== 'LI') {
            selected = selected.parentElement;
            findParent();
        }
        return selected;
    };

    // click event can be registered on the child nodes
    // that does not have the required coords prop
    // so its important to find the parent.
    findParent();

    if (selected){
        gotoSelectedResult(selected);
    }
}

function showResults (results) {
    const features = results.features;

    if (features.length === 0) {
        return;
    }

    // Ignore requests that started before a request which has already
    // been successfully rendered on to the UI.
    if (results.geocoding.timestamp < maxReqTimestampRendered) {
        return;
    }

    // Store the latest timestamp of the last request
    maxReqTimestampRendered = results.geocoding.timestamp;

    // Reset and display results container
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'block';

    const listEl = document.createElement('ul');
    listEl.className = 'tp-map-search-results-list';
    resultsEl.appendChild(listEl);

    for (let i = 0, j = features.length; i < j; i++) {
        const feature = features[i];
        const resultItem = document.createElement('li');
        resultItem.className = 'tp-map-search-result';
        resultItem.coords = feature.geometry.coordinates;
        resultItem.innerHTML += '<i class="bts bt-map-marker"></i> ' + highlight(feature.properties.label, input.value.trim());
        listEl.appendChild(resultItem);
    }

    container.addEventListener('click', onClickOutsideMenu, false);
}

function gotoSelectedResult (selectedEl) {
    const coords = selectedEl.coords;
    // Set placeholder immediately so there isn't a lag between the selection
    // and the reverse geocoder kicking in with the right location
    input.placeholder = selectedEl.textContent.trim();
    input.dataset.noUpdate = true;
    map.setView({ lat: coords[1], lng: coords[0] });
    clearResults();
    clearInput();
}

function clearResults () {
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'none';
    container.removeEventListener('click', onClickOutsideMenu, false);
}

function clearInput () {
    input.value = '';
}

function onClickOutsideMenu (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('tp-map-search')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('tp-map-search')) {
        clearResults();
        clearInput();
    }
}

function onSaveClickHandler (event) {
    let data = getCurrentMapViewData();
    if (bookmarks.saveBookmark(data) === true) {
        saveEl.classList.add('tp-active');
    }
}

function resetSaveIcon () {
    saveEl.classList.remove('tp-active');
}

function getCurrentMapViewData () {
    let center = map.getCenter();
    let zoom = map.getZoom();
    let label = input.placeholder || 'Unknown location';
    return {
        label,
        lat: center.lat,
        lng: center.lng,
        zoom,
        _date: new Date().toJSON()
    };
}

function onDividerMove (event) {
    // Updates the precision of the lat-lng display label
    // based on the available screen width
    input.dataset.noUpdate = true;
    if (event.mapX < 600) {
        latlngLabelPrecision = 2;
    }
    else if (event.mapX < 800) {
        latlngLabelPrecision = 3;
    }
    else {
        latlngLabelPrecision = 4;
    }
    setCurrentLocation();
}

function highlight (text, focus) {
    var r = new RegExp('(' + focus + ')', 'gi');
    return text.replace(r, '<strong>$1</strong>');
}

export default {
    init,
    setCurrentLocation
};
