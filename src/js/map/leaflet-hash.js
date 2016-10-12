/* eslint-disable no-underscore-dangle, func-names, no-param-reassign */
/**
 * A port of mlevan's leaflet-hash to ES2015 JavaScript.
 * Original: https://github.com/mlevans/leaflet-hash
 *
 * Changelog:
 * The constructor now accepts an `opts` object as a second parameter.
 * The only option right now is `refreshInterval` - how quickly to update the hash.
 * Also now accounts for fractional zoom precision (so it displays zoom to x digits)
 * This deprecates support for very old browsers because it no longer checks
 * for presence of hashchange event
 * and assumes Leaflet v1+ with fractional zoom quantities
 */
import L from 'leaflet';

export default class LeafletHash {
    constructor(map, opts = {}) {
        this.map = null;
        this.lastHash = null;
        this.movingMap = false;

        this.refreshInterval = opts.refreshInterval || 100;

        // defer hash change updates every 100ms
        this.changeDefer = 100;
        this.changeTimeout = null;
        this.isListening = false;
        this.hashChangeInterval = null;

        if (map) {
            this.init(map);
        }

        this.onHashChange = this.onHashChange.bind(this);
    }

    init(map) {
        this.map = map;

        // reset the hash
        this.lastHash = null;
        this.onHashChange();

        if (!this.isListening) {
            this.startListening();
        }
    }

    parseHash(hash) {
        if (hash.indexOf('#') === 0) {
            hash = hash.substr(1);
        }

        const args = hash.split('/');

        if (args.length === 3) {
            const zoom = Number.parseFloat(args[0]);
            const lat = Number.parseFloat(args[1]);
            const lon = Number.parseFloat(args[2]);

            if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
                return false;
            }

            return {
                center: new L.LatLng(lat, lon),
                zoom,
            };
        }

        return false;
    }

    formatHash(map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        const hashString = [
            zoom.toFixed(precision),
            center.lat.toFixed(precision),
            center.lng.toFixed(precision),
        ].join('/');

        return `#${hashString}`;
    }

    removeFrom(map) {
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }

        if (this.isListening) {
            this.stopListening();
        }

        this.map = null;
    }

    onMapMove() {
        // bail if we're moving the map (updating from a hash),
        // or if the map is not yet loaded
        if (this.movingMap || !this.map._loaded) {
            return;
        }

        const hash = this.formatHash(this.map);
        if (this.lastHash !== hash) {
            location.replace(hash);
            this.lastHash = hash;
        }
    }

    update() {
        const hash = location.hash;
        if (hash === this.lastHash) {
            return;
        }

        const parsed = this.parseHash(hash);
        if (parsed) {
            this.movingMap = true;
            this.map.setView(parsed.center, parsed.zoom);
            this.movingMap = false;
        } else {
            this.onMapMove(this.map);
        }
    }

    onHashChange() {
        // throttle calls to update() so that they only happen every
        // `changeDefer` ms
        if (!this.changeTimeout) {
            this.changeTimeout = window.setTimeout(() => {
                this.update();
                this.changeTimeout = null;
            }, this.changeDefer);
        }
    }

    startListening() {
        this.map.on('moveend', L.Util.throttle(this.onMapMove, this.refreshInterval, this), this);

        L.DomEvent.addListener(window, 'hashchange', this.onHashChange, this);

        this.isListening = true;
    }

    stopListening() {
        this.map.off('moveend', L.Util.throttle(this.onMapMove, this.refreshInterval, this), this);

        L.DomEvent.removeListener(window, 'hashchange', this.onHashChange, this);

        this.isListening = false;
    }
}

L.hash = function (map) {
    return new LeafletHash(map);
};

L.Map.prototype.addHash = function () {
    this._hash = L.hash(this);
};

L.Map.prototype.removeHash = function () {
    this._hash.removeFrom();
};
