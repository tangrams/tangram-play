import React from 'react';
import Autosuggest from 'react-autosuggest';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Icon from './icon.react';

import { httpGet, debounce } from '../tools/common';
import bookmarks from '../map/bookmarks';
import { map } from '../map/map';
import { config } from '../config';
import Modal from '../modals/modal';
// Required event dispatch and subscription for now while parts of app are React components and others are not
import { EventEmitter } from './event-emitter';

const SEARCH_THROTTLE = 300; // in ms, time to wait before repeating a request
const MAP_UPDATE_DELTA = 0.002;
let latlngLabelPrecision = 4;

/**
 * Returns delta change between current position of the map and distance moved
 * by the user
 */
function getMapChangeDelta (startLatLng, endLatLng) {
    let startX = startLatLng.lat;
    let startY = startLatLng.lng;
    let endX = endLatLng.lat;
    let endY = endLatLng.lng;
    return Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
}

/**
 * Represents the search bar and bookmarks button on the map panel
 */
export default class MapPanelSearch extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);
        let mapcenter = map.getCenter();

        // Temporarily using an active Button state because React doesn not
        // guarantee that setState will be synchronouse
        this.goToActive = false;

        this.state = {
            latlng: {
                lat: mapcenter.lat.toFixed(latlngLabelPrecision),
                lng: mapcenter.lng.toFixed(latlngLabelPrecision)
            }, // Represents lat lng of current position of the map
            value: '', // Represents text in the search bar
            placeholder: '', // Represents placeholder of the search bar
            suggestions: [], // Stores search suggestions from autocomplete
            bookmarkActive: '', // Represents wether bookmark button should show as active
            bookmarks: this._updateBookmarks() // Stores all bookmarks
        };

        // Set the value of the search bar to whatever the map is currently pointing to
        this._reverseGeocode(mapcenter);

        this.onChange = this.onChange.bind(this);
        this._onSuggestionsUpdateRequested = this._onSuggestionsUpdateRequested.bind(this);
        this._onSuggestionSelected = this._onSuggestionSelected.bind(this);
        this._renderSuggestion = this._renderSuggestion.bind(this);
        this._clickSave = this._clickSave.bind(this);
        this._setLabelPrecision = this._setLabelPrecision.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * Temporary requirement is to subscribe to events from map becuase it is
     * not a React component
     */
    componentDidMount () {
        // Need to subscribe to map zooming events so that our React component plays nice with the non-React map
        EventEmitter.subscribe('moveend', data => {
            let currentLatLng = map.getCenter();
            let delta = getMapChangeDelta(this.state.latlng, currentLatLng);

            // Only update location if the map center has moved more than a given delta
            // This is actually really necessary because EVERY update in the editor reloads
            // the map, which fires moveend events despite not actually moving the map
            // But we also have the bonus of not needing to make a reverse geocode request
            // for small changes of the map center.
            if (delta > MAP_UPDATE_DELTA) {
                this._setCurrentLatLng(currentLatLng);
                this._reverseGeocode(currentLatLng);
                this.setState({ bookmarkActive: '' });
            }
            if (this.goToActive) {
                this.setState({ bookmarkActive: 'active-fill' });
                this.goToActive = false;
            }
        });

        // Need a notification when all bookmarks are cleared succesfully in order to re-render list
        EventEmitter.subscribe('clearbookmarks', data => { this._bookmarkCallback(); });

        // Need a notification when divider moves to change the latlng label precision
        window.addEventListener('divider:dragend', this._setLabelPrecision);
    }

    /**
     * Given a latlng, make a request to API to find location details
     * @param latlng - a latitude and longitude pair
     */
    _reverseGeocode (latlng) {
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

    /** Geolocate functionality **/

    /**
     * Official React lifecycle method
     * Invoked when a component is receiving new props. This method is not called for the initial render.
     * Every time user locates him or herself we need to update the value of the search bar
     * @param nextProps - the new incoming props
     */
    componentWillReceiveProps (nextProps) {
        let geolocateActive = nextProps.geolocateActive;
        // If the geolocate button has been activated, perform a reverseGeocode
        if (geolocateActive.active === 'true') {
            this._reverseGeocode(geolocateActive.latlng);
        }
    }

    /** LatLng label **/

    /**
     * Change the latlng on the panel. Causes a re-render
     * @param latlng - a new set of latitude and longitude
     */
    _setCurrentLatLng (latlng) {
        this.setState({
            latlng: {
                lat: parseFloat(latlng.lat).toFixed(latlngLabelPrecision),
                lng: parseFloat(latlng.lng).toFixed(latlngLabelPrecision)
            }
        });
    }

    /**
     * Set a new latlng label with a new precision of diigts when divider moves
     * @param event - describes the divider move event that triggered the function
     */
    _setLabelPrecision (event) {
        // Updates the precision of the lat-lng display label
        // based on the available screen width
        let mapcontainer = document.getElementById('map-container');
        let width = mapcontainer.offsetWidth;

        if (width < 600) {
            latlngLabelPrecision = 2;
        }
        else if (width < 800) {
            latlngLabelPrecision = 3;
        }
        else {
            latlngLabelPrecision = 4;
        }

        this._setCurrentLatLng(this.state.latlng);
    }

    /** Bookmark functionality **/

    /**
     * Fires when user wants to save a bookmark. Causes re-render of bookmark list and button
     */
    _clickSave () {
        let data = this._getCurrentMapViewData();
        if (bookmarks.saveBookmark(data)) {
            this.setState({ bookmarks: this._updateBookmarks() });
            this.setState({ bookmarkActive: 'active-fill' });
        }
    }

    /**
     * Returns information for the current map view
     */
    _getCurrentMapViewData () {
        let center = map.getCenter();
        let zoom = map.getZoom();
        let label = this.state.value || 'Unknown location';

        // TODO: come up with a better distinction of when to show value and
        // when to show label to user
        if (label === 'Unknown location') {
            label = this.state.placeholder;
        }

        return {
            label,
            lat: center.lat,
            lng: center.lng,
            zoom,
            _date: new Date().toJSON()
        };
    }

    /**
     * Fires when a user clicks on a bookmark from bookmark list.
     * Causes map and search panel to re-render to go to the location on the bookmark
     * @param eventKey - each bookmark in the bookmark list identified by a unique
     *      key
     */
    _clickGoToBookmark (eventKey) {
        let bookmarks = this.state.bookmarks;
        let bookmark = bookmarks[eventKey];

        const coordinates = { lat: bookmark.lat, lng: bookmark.lng };
        const zoom = bookmark.zoom;

        if (!coordinates || !zoom) {
            return;
        }

        this.goToActive = true;
        map.setView(coordinates, zoom);
    }

    /**
     * Delete all bookmarks
     */
    _clickDeleteBookmarks () {
        const modal = new Modal('Are you sure you want to clear your bookmarks? This cannot be undone.', bookmarks.clearData);
        modal.show();
    }

    /**
     * Callback issued from 'bookmarks' object in order to update the panel UI.
     * Causes a re-render of the bookmarks list
     */
    _bookmarkCallback () {
        this.setState({ bookmarks: this._updateBookmarks() });
        this.setState({ bookmarkActive: '' });
    }

    /**
     * Fetches current bookmarks from 'bookmarks' object a causes re-render of
     * bookmarks list.
     */
    _updateBookmarks () {
        let newBookmarks = [];
        let bookmarkList = bookmarks.readData().data;

        for (let i = 0; i < bookmarkList.length; i++) {
            const bookmark = bookmarkList[i];
            let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

            newBookmarks.push({
                id: i,
                label: bookmark.label,
                lat: bookmark.lat.toFixed(4),
                lng: bookmark.lng.toFixed(4),
                zoom: fractionalZoom.toFixed(1),
                onClick: this._clickGoToBookmark.bind(this),
                active: ''
            });
        }

        return newBookmarks;
    }

    /** Search bar functionality **/

    /**
     * Fires any time there's a change in the search bar
     * Updates what is stored by value to correspond to what user is typing.
     * @param event - event that caused the change
     */
    onChange (event, { newValue, method }) {
        this.setState({
            value: newValue
        });
    }

    /**
     * Returns the currently selected result in order to update the search bar
     * placeholder as the user types
     * Required to be WAI-ARIA compliant: https://www.w3.org/TR/wai-aria-practices/#autocomplete
     * @param suggestion - current suggestion in the autocomplete list being selected
     *      or hovered on by user
     */
    _getSuggestionValue (suggestion) {
        return suggestion.properties.label;
    }

    /**
     * Everytime user types something different function will trigger and then
     * call a new autocomplete search request
     * @param value - value to search for
     */
    _onSuggestionsUpdateRequested ({ value, reason }) {
        // If user presses ENTER on the input search bar
        if (reason === 'enter-input') {
            this._search(value);
        }
        // For all other interactions, like moving up and down the suggestion list
        else {
            // Only call autocomplete if user has typed more than 1 character
            if (value.length >= 2) {
                this._autocomplete(value);
            }
        }
    }

    /**
     * Makes an autocomplete request to API based on what user has typed
     * @param query - value to search for
     */
    _autocomplete (query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;
        this._makeRequest(endpoint);
    }

    /**
     * Makes an search request to API when user presses ENTER
     * @param query - value to search for
     */
    _search (query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/search?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;
        this._makeRequest(endpoint);
    }

    /**
     * Makes a request to Mapzen API
     * @param endpoint - the address or connection point to the web service
     */
    _makeRequest (endpoint) {
        debounce(httpGet(endpoint, (err, res) => {
            if (err) {
                console.error(err);
            }
            else {
                this._showResults(JSON.parse(res));
            }
        }), SEARCH_THROTTLE);
    }

    /**
     * Stores a new set of autocomplete suggestions in 'suggestions' data
     * causing the search list to re-render
     * @param results - list of search results to display from autocomplete results
     */
    _showResults (results) {
        const features = results.features;

        this.setState({
            suggestions: features
        });
    }

    /**
     * Fires when user selects a result from the list of autocompletes
     * Upates the map and latlng label accordingly
     * @param event - event that cause user to select a particular results from
     *      suggestions list
     */
    _onSuggestionSelected (event, { suggestion }) {
        let lat = suggestion.geometry.coordinates[1];
        let lng = suggestion.geometry.coordinates[0];
        this._setCurrentLatLng({lat: lat, lng: lng});
        map.setView({ lat: lat, lng: lng });
        this.setState({ bookmarkActive: '' });
    }

    /**
     * Returns a JSX string for all the suggestions returned for autocomplete
     * @param suggestion - particular item from autocomplete result list to style
     */
    _renderSuggestion (suggestion, { currentValue, valueBeforeUpDown }) {
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

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        const { suggestions } = this.state;
        const inputProps = {
            placeholder: this.state.placeholder,
            value: this.state.value,
            onChange: this.onChange
        };

        return (
            <div className='map-panel-search-bookmarks'>
                {/* Search bar*/}
                <ButtonGroup className='map-search'>
                    {/* Search button */}
                    <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                        <Button className='map-panel-search-button'><Icon type={'bt-search'} /> </Button>
                    </OverlayTrigger>
                    {/* Autosuggest bar */}
                    <Autosuggest suggestions={suggestions}
                        onSuggestionsUpdateRequested={this._onSuggestionsUpdateRequested}
                        getSuggestionValue={this._getSuggestionValue}
                        renderSuggestion={this._renderSuggestion}
                        onSuggestionSelected={this._onSuggestionSelected}
                        inputProps={inputProps}/>
                    {/* Lat lng label */}
                    <div className='map-search-latlng'>{this.state.latlng.lat}, {this.state.latlng.lng}</div>
                    {/* Bookmark save button */}
                    <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                        <Button className='map-panel-save-button' onClick={this._clickSave}> <Icon type={'bt-star'} active={this.state.bookmarkActive}/> </Button>
                    </OverlayTrigger>
                </ButtonGroup>

                {/* Bookmark button*/}
                <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmarks'}</Tooltip>}>
                    <DropdownButton title={<Icon type={'bt-bookmark'} />} bsStyle='default' noCaret pullRight className='map-panel-bookmark-button' id='map-panel-bookmark-button'>
                        {/* Defining an immediately-invoked function expression inside JSX to decide whether to render full bookmark list or not */}
                        {(() => {
                            let bookmarkDropdownList;

                            // If no bookmarks, then display a no bookmarks message
                            if (this.state.bookmarks.length === 0) {
                                bookmarkDropdownList =
                                    <MenuItem key='none' className='bookmark-dropdown-center'>
                                        <div>No bookmarks yet!</div>
                                    </MenuItem>;
                            }
                            // If there are bookmarks
                            else {
                                // Create the bookmarks list
                                let list =
                                    this.state.bookmarks.map(function (result) {
                                        return <MenuItem eventKey={result.id} key={result.id} onSelect={result.onClick}>
                                                    <div className='bookmark-dropdown-icon'><Icon type={'bt-map-marker'} /></div>
                                                    <div>{result.label}<br />
                                                        <span className='bookmark-dropdown-text'>{result.lat}, {result.lng}, z{result.zoom}</span>
                                                    </div>
                                                </MenuItem>;
                                    });

                                // Add a delete button at the end
                                let deletebutton =
                                    <MenuItem key='delete' onSelect={this._clickDeleteBookmarks} className='bookmark-dropdown-center clear-bookmarks'>
                                        <div>Clear bookmarks</div>
                                    </MenuItem>;

                                // In React we have to use arrays if we want to concatenate two JSX fragments
                                bookmarkDropdownList = [list, deletebutton];
                            }

                            return bookmarkDropdownList;
                        })()}
                    </DropdownButton>
                </OverlayTrigger>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
MapPanelSearch.propTypes = {
    geolocateActive: React.PropTypes.object
};
