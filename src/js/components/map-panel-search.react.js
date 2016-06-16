import React from 'react';

import Autosuggest from 'react-autosuggest';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './icon.react';

import { httpGet, debounce } from '../tools/common';
import bookmarks from '../map/bookmarks';
import { map } from '../map/map';
import { EventEmitter } from './event-emittor';
import { config } from '../config';

const SEARCH_THROTTLE = 300; // in ms, time to wait before repeating a request
let latlngLabelPrecision = 4;
const MAP_UPDATE_DELTA = 0.002;

// Returns the currently selected result in order to update the search bar placeholder
function getSuggestionValue (suggestion) {
    return suggestion.properties.label;
}

function renderSuggestion (suggestion) {
    return (
        <span><Icon type={'bt-map-marker'} /> {suggestion.properties.label}</span>
    );
}

function getMapChangeDelta (startLatLng, endLatLng) {
    let startX = startLatLng.lat;
    let startY = startLatLng.lng;
    let endX = endLatLng.lat;
    let endY = endLatLng.lng;
    return Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
}

export default class MapPanelSearch extends React.Component {
    constructor (props) {
        super(props);
        let mapcenter = map.getCenter();
        this.state = {
            latlng: {
                lat: mapcenter.lat.toFixed(latlngLabelPrecision),
                lng: mapcenter.lng.toFixed(latlngLabelPrecision)
            },
            value: '',
            placeholder: '',
            suggestions: [],
            bookmarkActive: ''
        };

        // Set the value of the search bar to whatever the map is currently pointing to
        this.reverseGeocode(mapcenter);

        this.onChange = this.onChange.bind(this);
        this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.clickSave = this.clickSave.bind(this);
    }

    // Temporary requirement is to subscribe to events from map becuase it is not a React component
    componentDidMount () {
        let that = this;
        // Need to subscribe to map zooming events so that our React component plays nice with the non-React map
        EventEmitter.subscribe('moveend', function (data) {
            let currentLatLng = map.getCenter();
            let delta = getMapChangeDelta(that.state.latlng, currentLatLng);
            if (delta > MAP_UPDATE_DELTA) {
                that.setCurrentLatLng(currentLatLng);
                that.reverseGeocode(currentLatLng);
                that.setState({ bookmarkActive: '' });
            }
        });
    }

    setCurrentLatLng (latlng) {
        this.setState({
            latlng: {
                lat: latlng.lat.toFixed(latlngLabelPrecision),
                lng: latlng.lng.toFixed(latlngLabelPrecision)
            }
        });
    }

    // Every time user locates him or herself we need to update the value of the search bar
    componentWillReceiveProps (nextProps) {
        let geolocateActive = this.props.geolocateActive;
        if (geolocateActive.active === 'true') {
            this.reverseGeocode(geolocateActive.latlng); // set the lat lng here
        }
    }

    reverseGeocode (latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        const endpoint = `//${config.SEARCH.HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        debounce(httpGet(endpoint, (err, res) => {
            if (err) {
                console.error(err);
            }

            // TODO: Much more clever viewport/zoom based determination of current location
            let response = JSON.parse(res);
            if (!response.features || response.features.length === 0) {
                // Sometimes reverse geocoding returns no results
                this.setState({ placeholder: 'Unknown location' });
                // Very first time we load the bar we don't want a value, we want a placeholder
                if (this.state.value !== '') {
                    this.setState({ value: 'Unknown location' });
                }
            }
            else {
                this.setState({ placeholder: response.features[0].properties.label });
                // Very first time we load the bar we don't want a value, we want a placeholder
                if (this.state.value !== '') {
                    this.setState({ value: response.features[0].properties.label });
                }
            }
        }), SEARCH_THROTTLE);
    }

    clickSave () {
        let data = this.getCurrentMapViewData();
        if (bookmarks.saveBookmark(data) === true) {
            this.setState({ bookmarkActive: 'active' });
        }

        // Tell parent container to rerender bookmarks button
        this.props.callbackParent();
    }

    getCurrentMapViewData () {
        let center = map.getCenter();
        let zoom = map.getZoom();
        let label = this.state.value || 'Unknown location';
        return {
            label,
            lat: center.lat,
            lng: center.lng,
            zoom,
            _date: new Date().toJSON()
        };
    }

    /* Autocomplete search functions */
    // Fires any time there's a change in the search bar
    onChange (event, { newValue }) {
        this.setState({
            value: newValue
        });
    }

    // Fires when user starts typing in search bar
    onSuggestionsUpdateRequested ({ value }) {
        this.loadSuggestions(value);
    }

    // When user selects a result from the list of autocompletes
    onSuggestionSelected (event, { suggestion, suggestionValue, sectionIndex }) {
        let lat = suggestion.geometry.coordinates[1];
        let lng = suggestion.geometry.coordinates[0];
        this.setCurrentLatLng({lat: lat, lng: lng});
        map.setView({ lat: lat, lng: lng });
        this.setState({ bookmarkActive: '' });
    }

    // Load suggested search results
    loadSuggestions (value) {
        if (value.length >= 2) {
            this.autocomplete(value);
        }
    }

    autocomplete (query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        debounce(httpGet(endpoint, (err, res) => {
            if (err) {
                console.error(err);
            }
            else {
                this.showResults(JSON.parse(res));
            }
        }), SEARCH_THROTTLE);
    }

    showResults (results) {
        const features = results.features;

        this.setState({
            suggestions: features
        });
    }

    render () {
        const { suggestions } = this.state;
        const inputProps = {
            placeholder: this.state.placeholder,
            value: this.state.value,
            onChange: this.onChange
        };

        return (
            <ButtonGroup id='buttons-search'>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                    <Button> <Icon type={'bt-search'} /> </Button>
                </OverlayTrigger>
                <Autosuggest suggestions={suggestions}
                    onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    onSuggestionSelected={this.onSuggestionSelected}
                    inputProps={inputProps} />
                <div className='map-search-latlng'>{this.state.latlng.lat},{this.state.latlng.lng}</div>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                    <Button onClick={this.clickSave}> <Icon type={'bt-star'} active={this.state.bookmarkActive}/> </Button>
                </OverlayTrigger>
            </ButtonGroup>
        );
    }
}

MapPanelSearch.propTypes = {
    geolocateActive: React.PropTypes.object,
    callbackParent: React.PropTypes.func
};
