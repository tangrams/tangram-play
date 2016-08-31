import React from 'react';
import Autosuggest from 'react-autosuggest';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';

import { throttle } from 'lodash';
import { EventEmitter } from './event-emitter';
import { map } from '../map/map';
import { config } from '../config';
import { saveLocationBookmark } from '../map/bookmarks';

const MAP_UPDATE_DELTA = 0.002;

/**
 * Returns delta change between current position of the map and distance moved
 * by the user
 */
function getMapChangeDelta (startLatLng, endLatLng) {
    const startX = startLatLng.lat;
    const startY = startLatLng.lng;
    const endX = endLatLng.lat;
    const endY = endLatLng.lng;
    return Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
}

export default class MapPanelLocationBar extends React.Component {
    constructor (props) {
        super(props);

        const latlngLabelPrecision = 4;

        this.state = {
            latlngLabelPrecision: latlngLabelPrecision,
            latlng: {
                lat: 0,
                lng: 0
            }, // Represents lat lng of current position of the map
            value: '', // Represents text in the search bar
            placeholder: '', // Represents placeholder of the search bar
            suggestions: [], // Stores search suggestions from autocomplete
            bookmarkActive: false, // Represents wether bookmark button should show as active
        };

        EventEmitter.subscribe('map:init', () => {
            const mapCenter = map.getCenter();

            // Set the value of the search bar to whatever the map is currently
            // pointing to. this.reverseGeocode() returns a Promise (if
            // successful), passing in the value of the place to display.
            // Do all state mutation after this returns to force setState
            // to batch.
            this.reverseGeocode(mapCenter)
                .then((state = {}) => {
                    const newState = Object.assign({}, state, {
                        latlng: {
                            lat: mapCenter.lat,
                            lng: mapCenter.lng
                        }
                    });

                    this.setState(newState);
                });
        });

        // Create a throttled version of `this.unthrottledReverseGeocode()`.
        // Always call this and not the undebounced version.
        this.reverseGeocode = throttle(this.unthrottledReverseGeocode, 1000, {
            leading: true, // Apparently this function becomes undefined if `leading: false` (???)
            trailing: true
        });

        this.relocatingMap = false;
        this.shouldCloseDropdownNextEnter = false; // Boolean to track whether we should close the map on next 'Enter'

        this.onChangeAutosuggest = this.onChangeAutosuggest.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.onClickSave = this.onClickSave.bind(this);
        this.setLabelPrecision = this.setLabelPrecision.bind(this);
        this.makeRequest = this.makeRequest.bind(this);
    }

    componentDidMount () {
        // Need to subscribe to map zooming events so that our React component
        // plays nice with the non-React map
        EventEmitter.subscribe('leaflet:moveend', (data) => {
            if (!this.relocatingMap) {
                const currentLatLng = map.getCenter();
                const delta = getMapChangeDelta(this.state.latlng, currentLatLng);

                // Only update location if the map center has moved more than a given delta
                // This is actually really necessary because EVERY update in the editor reloads
                // the map, which fires moveend events despite not actually moving the map
                // But we also have the bonus of not needing to make a reverse geocode request
                // for small changes of the map center.
                if (delta > MAP_UPDATE_DELTA) {
                    this.reverseGeocode(currentLatLng)
                        .then((state = {}) => {
                            const newState = Object.assign({}, state, {
                                bookmarkActive: false,
                                latlng: {
                                    lat: currentLatLng.lat,
                                    lng: currentLatLng.lng
                                }
                            });

                            this.setState(newState);
                        });
                }
            }
            else {
                this.relocatingMap = false;
            }
        });

        // Listeners to respond to Bookmark component state changes.
        EventEmitter.subscribe('bookmarks:active', (data) => {
            this.setState({ bookmarkActive: true });
        });

        EventEmitter.subscribe('bookmarks:inactive', (data) => {
            this.setState({ bookmarkActive: false });
        });

        // Need a notification when divider moves to change the latlng label precision
        EventEmitter.subscribe('divider:drag', this.setLabelPrecision);

        // Need to add an event listener to detect keydown on ENTER. Why? Because the react Autosuggest
        // currently closes the panel upon 'Enter'
        // Where that happens is here: https://github.com/moroshko/react-autosuggest/blob/master/src/Autosuggest.js
        let inputDIV = this.refs.autosuggestBar.input;

        inputDIV.addEventListener('keydown', (e) => {
            // If the key user pressed is Enter
            if (e.key === 'Enter') {
                // Find out whether the input div has an 'aria-activedescentant' property
                // This property tells us whether the user is actually selecting a result from the list of suggestions
                let activeSuggestion = inputDIV.hasAttribute('aria-activedescendant'); // A boolean

                // Also find out whether the panel is open or not
                let dropdownExpanded = inputDIV.getAttribute('aria-expanded'); // But this is a string
                dropdownExpanded = (dropdownExpanded === 'true'); // Now its a boolean

                // If the user is pressing Enter after a list of search results are displayed, the dropdown should close
                if (!activeSuggestion && dropdownExpanded && this.shouldCloseDropdownNextEnter) {
                    inputDIV.blur();
                    inputDIV.select();
                    this.shouldCloseDropdownNextEnter = false;
                }
                // Only if the user is pressing enter on the main search bar (NOT a suggestion) do we prevent the default Enter event from bubbling
                // Aria has to be expanded as well
                else if (!activeSuggestion && dropdownExpanded) {
                    this.search(this.state.value); // Perform a search request
                    this.shouldCloseDropdownNextEnter = true;
                    e.preventDefault();
                    e.stopPropagation();
                }
                // If aria es closed and user presses enter, then aria should open
                else if (!dropdownExpanded) {
                    this.search(this.state.value);
                    e.preventDefault();
                    e.stopPropagation();

                    this.shouldCloseDropdownNextEnter = true;
                    inputDIV.blur();
                    inputDIV.focus();
                }
            }
        });
    }

    /**
     * Official React lifecycle method
     * Invoked when a component is receiving new props. This method is not called for the initial render.
     * Every time user locates him or herself we need to update the value of the search bar
     * @param nextProps - the new incoming props
     */
    componentWillReceiveProps (nextProps) {
        const geolocateActive = nextProps.geolocateActive;

        // If the geolocate button has been activated, perform a reverseGeocode
        if (geolocateActive.active === 'true') {
            this.reverseGeocode(geolocateActive.latlng)
                .then((state) => {
                    this.setState(state);
                });
        }
    }

    /**
     * Given a latlng, make a request to API to find location details
     * Do not use this method directly. In `constructor()`` we throttle this
     * function to prevent frequent API calls and attach it to
     * `this.reverseGeocode()`. Call that method instead. Its arguments and
     * return value will remain the same.
     *
     * @param {object} latlng - a latitude and longitude pair
     * @returns {Promise} - resolves with a new state object
     */
    unthrottledReverseGeocode (latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        const endpoint = `//${config.SEARCH.HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        return window.fetch(endpoint)
            .then((response) => {
                return response.json();
            })
            .then((response) => {
                const state = {};

                // TODO: Much more clever viewport/zoom based determination of current location
                if (!response.features || response.features.length === 0) {
                    // Sometimes reverse geocoding returns no results
                    state.placeholder = 'Unknown location';
                    // Very first time we load the bar we don't want a value, we want a placeholder
                    if (this.state.value !== '') {
                        state.value = 'Unknown location';
                    }
                }
                else {
                    state.placeholder = response.features[0].properties.label;
                    // Very first time we load the bar we don't want a value, we want a placeholder
                    if (this.state.value !== '') {
                        state.value = response.features[0].properties.label;
                    }
                }

                return state;
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /** LatLng label **/

    /**
     * Set a new latlng label with a new precision of diigts when divider moves
     * @param event - describes the divider move event that triggered the function
     */
    setLabelPrecision (event) {
        // Updates the precision of the lat-lng display label
        // based on the available screen width
        const mapcontainer = document.getElementById('map-container');
        const width = mapcontainer.offsetWidth;
        let latlngLabelPrecision;

        if (width < 600) {
            latlngLabelPrecision = 2;
        }
        else if (width < 800) {
            latlngLabelPrecision = 3;
        }
        else {
            latlngLabelPrecision = 4;
        }

        this.setState({
            latlngLabelPrecision: latlngLabelPrecision
        });
    }

    /** Bookmark functionality **/

    /**
     * Fires when user wants to save a bookmark. Causes re-render of bookmark list and button
     */
    onClickSave () {
        const data = this.getCurrentMapViewData();
        saveLocationBookmark(data)
            .then((bookmarks) => {
                this.setState({ bookmarkActive: true });
                EventEmitter.dispatch('bookmarks:updated', bookmarks);
            });
    }

    /**
     * Returns information for the current map view
     */
    getCurrentMapViewData () {
        const center = map.getCenter();

        return {
            label: this.state.value || this.state.placeholder,
            lat: center.lat,
            lng: center.lng,
            zoom: map.getZoom(),
            _date: new Date().toJSON()
        };
    }

    /**
     * Returns the currently selected result in order to update the search bar
     * placeholder as the user types
     * Required to be WAI-ARIA compliant: https://www.w3.org/TR/wai-aria-practices/#autocomplete
     * @param suggestion - current suggestion in the autocomplete list being selected
     *      or hovered on by user
     */
    getSuggestionValue (suggestion) {
        return suggestion.properties.label;
    }

    /**
     * Everytime user types something different function will trigger and then
     * call a new autocomplete search request
     * @param value - value to search for
     */
    onSuggestionsFetchRequested ({ value }) {
        // Only call autocomplete if user has typed more than 1 character
        if (value.length >= 2) {
            this.autocomplete(value);
        }
    }

    /**
     * Required, as of react-autosuggest@6.0.0, to set suggestions to blank
     */
    onSuggestionsClearRequested () {
        this.setState({
            suggestions: []
        });
    }

    /**
     * Makes an autocomplete request to API based on what user has typed
     * @param query - value to search for
     */
    autocomplete (query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        this.makeRequest(endpoint);
    }

    /**
     * Makes an search request to API when user presses ENTER
     * @param query - value to search for
     */
    search (query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/search?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        this.makeRequest(endpoint);
    }

    /**
     * Makes a request to Mapzen API
     * @param endpoint - the address or connection point to the web service
     */
    makeRequest (endpoint) {
        window.fetch(endpoint)
            .then((response) => {
                return response.json();
            })
            .then((results) => {
                // Stores a new set of autocomplete suggestions in 'suggestions'
                // data causing the search list to re-render
                this.setState({
                    suggestions: results.features
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    /**
     * Fires when user selects a result from the list of autocompletes
     * Upates the map and latlng label accordingly
     * @param event - event that cause user to select a particular results from
     *      suggestions list
     */
    onSuggestionSelected (event, { suggestion }) {
        const lat = suggestion.geometry.coordinates[1];
        const lng = suggestion.geometry.coordinates[0];

        // Set a boolean that we will use to know if we should update our value once the map moves.
        // If the map moves because of a suggestion being selected, we do NOT need to update our value in the 'leaflet:moveend' event listener
        this.relocatingMap = true;
        map.setView({ lat: lat, lng: lng });
        this.setState({
            bookmarkActive: false,
            latlng: {
                lat: lat,
                lng: lng
            }
        });
    }

    /**
     * Returns a JSX string for all the suggestions returned for autocomplete
     * This must be a pure function (react-autosuggest optimizes rendering
     * performance based on this assumption).
     *
     * @param suggestion - particular item from autocomplete result list to style
     */
    renderSuggestion (suggestion, { query }) {
        const label = suggestion.properties.label;

        // Highlight the input query
        const r = new RegExp('(' + query + ')', 'gi');
        const parts = label.split(r);
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].toLowerCase() === query.toLowerCase()) {
                parts[i] = <strong key={i}>{parts[i]}</strong>;
            }
        }

        return (
            <span>
                <Icon type={'bt-map-marker'} />{parts}
            </span>
        );
    }

    /** Search bar functionality **/

    /**
     * Fires any time there's a change in the search bar
     * Updates what is stored by value to correspond to what user is typing.
     * @param event - event that caused the change
     */
    onChangeAutosuggest (event, { newValue, method }) {
        this.setState({
            value: newValue
        });
    }

    /**
     * Fires when user focuses on autosuggest
     * Selects text in the input, if any. This allows the user to press
     * Backspace once to clear input, or any other character to automatically
     * begin a new search. This is intended to not conflict with WAI-ARIA
     * guidelines set by react-autosuggest, but behaves similarly to browser
     * location bars.
     *
     * @param event - event that caused the change
     */
    onFocusAutosuggest (event) {
        event.target.select();
    }

    render () {
        const { suggestions } = this.state;
        const inputProps = {
            placeholder: this.state.placeholder,
            value: this.state.value,
            onChange: this.onChangeAutosuggest,
            onFocus: this.onFocusAutosuggest
        };

        const latlng = {
            lat: parseFloat(this.state.latlng.lat).toFixed(this.state.latlngLabelPrecision),
            lng: parseFloat(this.state.latlng.lng).toFixed(this.state.latlngLabelPrecision)
        };

        return (
            <ButtonGroup className='map-search' >
                {/* Search button */}
                <OverlayTrigger
                    rootClose
                    placement='bottom'
                    overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}
                >
                    <Button className='map-panel-search-button'>
                        <Icon type={'bt-search'} />
                    </Button>
                </OverlayTrigger>

                {/* Autosuggest bar */}
                <Autosuggest ref='autosuggestBar'
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={this.getSuggestionValue}
                    renderSuggestion={this.renderSuggestion}
                    onSuggestionSelected={this.onSuggestionSelected}
                    inputProps={inputProps}
                    focusFirstSuggestion={false}
                />

                {/* Lat lng label */}
                <div className='map-search-latlng'>{latlng.lat}, {latlng.lng}</div>

                {/* Bookmark save button */}
                <OverlayTrigger
                    rootClose
                    placement='bottom'
                    overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}
                >
                    <Button className='map-panel-save-button' onClick={this.onClickSave}>
                        <Icon type={'bt-star'} active={this.state.bookmarkActive} />
                    </Button>
                </OverlayTrigger>
            </ButtonGroup>
        );
    }
}

/**
 * Prop validation required by React
 */
MapPanelLocationBar.propTypes = {
    geolocateActive: React.PropTypes.object
};
