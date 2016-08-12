import React from 'react';
import Autosuggest from 'react-autosuggest';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';

import { EventEmitter } from './event-emitter';
import { map } from '../map/map';
import { config } from '../config';
import bookmarks from '../map/bookmarks';

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

        const mapCenter = map.getCenter();
        const latlngLabelPrecision = 4;

        this.state = {
            latlngLabelPrecision: latlngLabelPrecision,
            latlng: {
                lat: mapCenter.lat.toFixed(latlngLabelPrecision),
                lng: mapCenter.lng.toFixed(latlngLabelPrecision)
            }, // Represents lat lng of current position of the map
            value: '', // Represents text in the search bar
            placeholder: '', // Represents placeholder of the search bar
            suggestions: [], // Stores search suggestions from autocomplete
            bookmarkActive: false, // Represents wether bookmark button should show as active
        };

        // Set the value of the search bar to whatever the map is currently pointing to
        this.reverseGeocode(mapCenter);

        this.onChangeAutosuggest = this.onChangeAutosuggest.bind(this);
        this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
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
            const currentLatLng = map.getCenter();
            const delta = getMapChangeDelta(this.state.latlng, currentLatLng);

            // Only update location if the map center has moved more than a given delta
            // This is actually really necessary because EVERY update in the editor reloads
            // the map, which fires moveend events despite not actually moving the map
            // But we also have the bonus of not needing to make a reverse geocode request
            // for small changes of the map center.
            if (delta > MAP_UPDATE_DELTA) {
                this.reverseGeocode(currentLatLng);
                this.setState({
                    bookmarkActive: false,
                    latlng: {
                        lat: currentLatLng.lat,
                        lng: currentLatLng.lng
                    }
                });
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
                let ariaExpanded = inputDIV.getAttribute('aria-expanded'); // But this is a string
                ariaExpanded = (ariaExpanded === "true"); // Now its a boolean

                // Only if the user is pressing enter on the main search bar (NOT a suggestion) do we prevent the default Enter event from bubbling
                // Aria has to be expanded as well
                if (!activeSuggestion && ariaExpanded) {
                    this.search(this.state.value); // Perform a search request
                    e.preventDefault();
                    e.stopPropagation();
                }
                // If aria es closed and user presses enter, then aria should open
                else if (!ariaExpanded) {
                    console.log("Panel should open");

                    e.preventDefault();
                    e.stopPropagation();

                    //react-autosuggest__container

                    inputDIV.onclick=function(){ console.log("I WAS CLICKED"); };


                    // inputDIV.focus();
                    // inputDIV.select();

                    let el = document.getElementsByClassName('navbar-header')[0];
                    console.log(el);
                    el.click();
                    inputDIV.click();
                    this.search(this.state.value);

                    // let parent = inputDIV.parentElement;
                    // parent.className += " react-autosuggest__container--open";
                    // console.log(inputDIV.parentElement);
                    // console.log(this.state.suggestions);
                    // this.refs.autosuggestBar.input.setAttribute('aria-expanded', "true");


                    // this.refs.autosuggestBar.input.setAttribute('aria-expanded', "true");
                    // e.preventDefault();
                    // e.stopPropagation();
                    // this.refs.autosuggestBar.input.setAttribute('aria-expanded', "true");
                    // this.refs.autosuggestBar.forceUpdate();
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
            this.reverseGeocode(geolocateActive.latlng);
        }
    }

    /**
     * Given a latlng, make a request to API to find location details
     * @param latlng - a latitude and longitude pair
     */
    reverseGeocode (latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        const endpoint = `//${config.SEARCH.HOST}/v1/reverse?point.lat=${lat}&point.lon=${lng}&size=1&layers=coarse&api_key=${config.SEARCH.API_KEY}`;

        window.fetch(endpoint)
            .then((response) => {
                return response.json();
            })
            .then((response) => {
                // TODO: Much more clever viewport/zoom based determination of current location
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
        if (bookmarks.saveBookmark(data)) {
            this.setState({
                bookmarkActive: true
            });
        }
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
    onSuggestionsUpdateRequested ({ value, reason }) {
        console.log("on suggestion update requests", reason);
        // Only call autocomplete if user has typed more than 1 character
        if (value.length >= 2) {
            this.autocomplete(value);
        }
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
     * @param suggestion - particular item from autocomplete result list to style
     */
    renderSuggestion (suggestion, { currentValue, valueBeforeUpDown }) {
        console.log("rendering suggestions");
        let value;
        let label = suggestion.properties.label;

        // Have to highlight in a different way because of this limitation in rendering JSX and HTML tags
        // Read: https://facebook.github.io/react/tips/dangerously-set-inner-html.html
        if (valueBeforeUpDown === null) {
            value = this.state.value;
        }
        else {
            value = valueBeforeUpDown;
        }

        let r = new RegExp('(' + value + ')', 'gi');
        var parts = label.split(r);
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].toLowerCase() === value.toLowerCase()) {
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
        console.log("re rendering");
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
                    onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
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
