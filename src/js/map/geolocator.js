import { map } from '../map/map';
import ErrorModal from '../modals/modal.error';

const geolocator = window.navigator.geolocation;
const buttonEl = document.getElementById('geolocator');

// Initializes the geocoder component
export function initGeolocator () {
    // Hide the geolocator button if geolocation is not supported on the browser
    if (!geolocator) {
        buttonEl.parentNode.style.display = 'none';
    }
    // If enabled, attach an event listener to it
    else {
        buttonEl.addEventListener('click', event => {
            if (buttonEl.classList.contains('active')) {
                return false;
            }
            buttonEl.classList.add('active');
            getCurrentLocation(onGeolocateSuccess, onGeolocateError);
        });
    }
}

function getCurrentLocation (success, error) {
    const geolocator = window.navigator.geolocation;
    const options = {
        enableHighAccuracy: true,
        maximumAge: 10000,
    };

    // Fixes an infinite loop bug with Safari
    // https://stackoverflow.com/questions/27150465/geolocation-api-in-safari-8-and-7-1-keeps-asking-permission/28436277#28436277
    window.setTimeout(() => {
        geolocator.getCurrentPosition(success, error, options);
    }, 0);
}

function onGeolocateSuccess (position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy || 0;

    let originalZoom = map.getZoom();
    let desiredZoom = originalZoom;

    // Only zoom to a radius if the accuracy is actually a number or present
    if (accuracy) {
        // The circle needs to be added to the map in order for .getBounds() to work
        let circle = L.circle([latitude, longitude], accuracy).addTo(map);
        let bounds = circle.getBounds();

        // Fit view to the accuracy diameter
        map.fitBounds(bounds);

        // If the new zoom level is within a +/- 1 range of the original
        // zoom level, keep it the same
        let newZoom = map.getZoom();
        desiredZoom = (newZoom >= originalZoom - 1 && newZoom <= originalZoom + 1) ?
            originalZoom : newZoom;

        // Clean up
        circle.remove();
    }
    else {
        // Zoom in a bit only if user's view is very zoomed out
        desiredZoom = (originalZoom < 16) ? 16 : originalZoom;
    }

    map.setZoom(desiredZoom);

    resetGeolocateButton();
}

/**
 * Handles geolocation error. Reports a user friendly error message
 * if PositionError has provided the reason why it did not work.
 *
 * @param {PositionError} err - a PositionError object representing the
 *      reason for the geolocation failure. It contains an error code
 *      and a user-agent defined message. See also:
 *      see https://developer.mozilla.org/en-US/docs/Web/API/PositionError
 */
function onGeolocateError (err) {
    let message = 'Tangram Play could not retrieve your current position and we do not have enough information to know why.';
    switch (err.code) {
        case 1: // PERMISSION_DENIED
            message = 'Tangram Play could not retrieve your current position because we do not have permission to use your browser’s geolocation feature. To get your current location, please turn it back on in your browser settings.';
            break;
        case 2: // POSITION_UNAVAILABLE
            message = 'Tangram Play could not retrieve your current position because your browser’s geolocation feature reported an internal error.';
            break;
        case 3: // TIMEOUT
            message = 'Tangram Play could not retrieve your current position because your browser’s geolocation feature did not respond.';
            break;
        default:
            break;
    }
    const modal = new ErrorModal({ message });
    modal.show();
    resetGeolocateButton();
}

function resetGeolocateButton () {
    buttonEl.classList.remove('active');
}
