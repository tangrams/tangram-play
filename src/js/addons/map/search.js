'use strict';

import TangramPlay from 'app/TangramPlay';
import { map, container } from 'app/TangramPlay';
import { httpGet, debounce } from 'app/core/common';

const PELIAS_KEY = 'search-xFAc9NI';
const PELIAS_HOST = 'search.mapzen.com';
let input;
let latlng;
let latlngLabel;
let latlngLabelPrecision = 4;
let resultsEl;
let currentLocation;

function init () {
    // Cache reference to elements
    input = container.querySelector('.tp-map-search-input');
    latlngLabel = container.querySelector('.tp-map-latlng-label');
    resultsEl = container.querySelector('.tp-map-search-results');

    input.addEventListener('keyup', onInputKeyupHandler, false);
    input.addEventListener('keydown', onInputKeydownHandler, false);
    input.addEventListener('focus', onInputFocusHandler, false);
    resultsEl.addEventListener('click', onResultsClickHandler, false);

    TangramPlay.on('resize', onDividerMove);
}

function setCurrentLocation () {
    latlng = map.getCenter();
    latlngLabel.textContent = `${latlng.lat.toFixed(latlngLabelPrecision)}, ${latlng.lng.toFixed(latlngLabelPrecision)}`;

    // Does not update location if the no-update flag is false
    // This is used to prevent an unnecessary additional request to Pelias
    if (input.dataset.noUpdate !== 'true') {
        reverseGeocode(latlng);
    }
    input.dataset.noUpdate = false;
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

function onInputKeyupHandler (event) {
    let key = event.which || event.keyCode;
    let query = input.value.trim();
    if (query.length < 2) {
        clearResults();
        return;
    }

    // Ignore all further action if the keycode matches an arrow
    // key (handled via keydown event)
    if (key === 13 || key === 38 || key === 40) {
        return;
    }

    // keyCode 27 = esc key (esc should clear results)
    if (key === 27) {
        input.blur();
        clearInput();
        clearResults();
        return;
    }

    suggest(query);
}

function onInputKeydownHandler (event) {
    let key = event.which || event.keyCode;

    var list = resultsEl.querySelectorAll('.tp-map-search-result');
    var selected = resultsEl.querySelector('.tp-map-search-active');
    var selectedPosition;

    for (var i = 0; i < list.length; i++) {
        if (list[i] === selected) {
            selectedPosition = i;
            break;
        }
    }

    switch (event.keyCode) {
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
            } else {
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
            } else {
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
    let query = input.value.trim();
    if (query.length >= 2) {
        suggest(query);
    }
}

// Get autocomplete suggestions
function suggest (query) {
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

function onResultsClickHandler (event) {
    var selected = event.target;
    var findParent = function () {
        if (selected.nodeName !== 'LI') {
            selected = selected.parentElement;
            findParent();
        }
        return selected;
    };

    // click event can be registered on the child nodes
    // that does not have the required coords prop
    // so its important to find the parent.
    findParent();

    gotoSelectedResult(selected);
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

    container.addEventListener('click', onClickOutsideDropdown, false);
}

function gotoSelectedResult (selectedEl) {
    let coords = selectedEl.coords;
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
    container.removeEventListener('click', onClickOutsideDropdown, false);
}

function clearInput () {
    input.value = '';
}

function onClickOutsideDropdown (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('tp-map-search')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('tp-map-search')) {
        clearResults();
        clearInput();
    }
}

function onDividerMove (event) {
    // Updates the precision of the lat-lng display label
    // based on the available screen width
    input.dataset.noUpdate = true;
    if (event.mapX < 600) {
        latlngLabelPrecision = 2;
    }
    else if (event.mapX < 700) {
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
