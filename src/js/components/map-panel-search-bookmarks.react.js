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
import { EventEmitter } from './event-emittor';

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
            bookmarks: this.updateBookmarks() // Stores all bookmarks
        };

        // Set the value of the search bar to whatever the map is currently pointing to
        this.reverseGeocode(mapcenter);

        this.onChange = this.onChange.bind(this);
        this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.clickSave = this.clickSave.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * Temporary requirement is to subscribe to events from map becuase it is
     * not a React component
     */
    componentDidMount () {
        let that = this;
        // Need to subscribe to map zooming events so that our React component plays nice with the non-React map
        EventEmitter.subscribe('moveend', function (data) {
            let currentLatLng = map.getCenter();
            let delta = getMapChangeDelta(that.state.latlng, currentLatLng);

            // Only update location if the map center has moved more than a given delta
            // This is actually really necessary because EVERY update in the editor reloads
            // the map, which fires moveend events despite not actually moving the map
            // But we also have the bonus of not needing to make a reverse geocode request
            // for small changes of the map center.
            if (delta > MAP_UPDATE_DELTA) {
                that.setCurrentLatLng(currentLatLng);
                that.reverseGeocode(currentLatLng);
                that.setState({ bookmarkActive: '' });
            }
            if (that.goToActive) {
                that.setState({ bookmarkActive: 'active' });
                that.goToActive = false;
            }
        });

        // Need a notification when all bookmarks are cleared succesfully in order to re-render list
        EventEmitter.subscribe('clearbookmarks', function (data) { that.bookmarkCallback(); });

        // Need a notification when divider moves to change the latlng label precision
        window.addEventListener('divider:dragend', that.setLabelPrecision);
    }

    /**
     * Given a latlng, make a request to API to find location details
     * @param latlng - a latitude and longitude pair
     */
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
            this.reverseGeocode(geolocateActive.latlng);
        }
    }

    /** LatLng label **/

    /**
     * Change the latlng on the panel. Causes a re-render
     * @param latlng - a new set of latitude and longitude
     */
    setCurrentLatLng (latlng) {
        this.setState({
            latlng: {
                lat: latlng.lat.toFixed(latlngLabelPrecision),
                lng: latlng.lng.toFixed(latlngLabelPrecision)
            }
        });
    }

    /**
     * Set a new latlng label with a new precision of diigts when divider moves
     * @param event - describes the divider move event that triggered the function
     */
    setLabelPrecision (event) {
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
    }

    /** Bookmark functionality **/

    /**
     * Fires when user wants to save a bookmark. Causes re-render of bookmark list and button
     */
    clickSave () {
        let data = this.getCurrentMapViewData();
        if (bookmarks.saveBookmark(data) === true) {
            this.setState({ bookmarks: this.updateBookmarks() });
            this.setState({ bookmarkActive: 'active' });
        }
    }

    /**
     * Returns information for the current map view
     */
    getCurrentMapViewData () {
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
    clickGoToBookmark (eventKey) {
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
    clickDeleteBookmarks () {
        const modal = new Modal('Are you sure you want to clear your bookmarks? This cannot be undone.', bookmarks.clearData);
        modal.show();
    }

    /**
     * Callback issued from 'bookmarks' object in order to update the panel UI.
     * Causes a re-render of the bookmarks list
     */
    bookmarkCallback () {
        this.setState({ bookmarks: this.updateBookmarks() });
        this.setState({ bookmarkActive: '' });
    }

    /**
     * Fetches current bookmarks from 'bookmarks' object a causes re-render of
     * bookmarks list.
     */
    updateBookmarks () {
        let newBookmarks = [];
        let bookmarkList = bookmarks.readData().data;

        if (bookmarkList.length === 0) {
            newBookmarks.push({
                id: 0,
                label: 'No bookmarks yet!'
            });
        }
        else {
            for (let i = 0; i < bookmarkList.length; i++) {
                const bookmark = bookmarkList[i];
                let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

                newBookmarks.push({
                    id: i,
                    label: bookmark.label,
                    lat: bookmark.lat.toFixed(4),
                    lng: bookmark.lng.toFixed(4),
                    zoom: fractionalZoom.toFixed(1),
                    onClick: this.clickGoToBookmark.bind(this),
                    active: ''
                });
            }

            newBookmarks.push({
                id: bookmarkList.length,
                label: 'Clear bookmarks',
                onClick: this.clickDeleteBookmarks.bind(this)
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
    onChange (event, { newValue }) {
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
    getSuggestionValue (suggestion) {
        return suggestion.properties.label;
    }

    /**
     * Everytime user types something different function will trigger and then
     * call a new autocomplete search request
     * @param value - value to search for
     */
    onSuggestionsUpdateRequested ({ value }) {
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

        debounce(httpGet(endpoint, (err, res) => {
            if (err) {
                console.error(err);
            }
            else {
                this.showResults(JSON.parse(res));
            }
        }), SEARCH_THROTTLE);
    }

    /**
     * Stores a new set of autocomplete suggestions in 'suggestions' data
     * causing the search list to re-render
     * @param results - list of search results to display from autocomplete results
     */
    showResults (results) {
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
    onSuggestionSelected (event, { suggestion }) {
        let lat = suggestion.geometry.coordinates[1];
        let lng = suggestion.geometry.coordinates[0];
        this.setCurrentLatLng({lat: lat, lng: lng});
        map.setView({ lat: lat, lng: lng });
        this.setState({ bookmarkActive: '' });
    }

    /**
     * Returns a JSX string for all the suggestions returned for autocomplete
     * @param suggestion - particular item from autocomplete result list to style
     */
    renderSuggestion (suggestion) {
        let value = this.state.value;
        let label = suggestion.properties.label;

        // Have to highlight in a different way because of this limitation in rendering JSX and HTML tags
        // Read: https://facebook.github.io/react/tips/dangerously-set-inner-html.html
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
                    <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                        <Button> <Icon type={'bt-search'} /> </Button>
                    </OverlayTrigger>
                    {/* Autosuggest bar */}
                    <Autosuggest suggestions={suggestions}
                        onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
                        getSuggestionValue={this.getSuggestionValue}
                        renderSuggestion={this.renderSuggestion}
                        onSuggestionSelected={this.onSuggestionSelected}
                        inputProps={inputProps} />
                    {/* Lat lng label */}
                    <div className='map-search-latlng'>{this.state.latlng.lat},{this.state.latlng.lng}</div>
                    {/* Bookmark save button */}
                    <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                        <Button onClick={this.clickSave}> <Icon type={'bt-star'} active={this.state.bookmarkActive}/> </Button>
                    </OverlayTrigger>
                </ButtonGroup>

                {/* Bookmark button*/}
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmarks'}</Tooltip>}>
                    <DropdownButton title={<Icon type={'bt-bookmark'} />} bsStyle='default' noCaret pullRight id='map-panel-bookmark-button'>
                        {this.state.bookmarks.map(function (result) {
                            return <MenuItem eventKey={result.id} key={result.id} onSelect={result.onClick}>
                                        <div className='bookmark-dropdown-icon'><Icon type={'bt-map-marker'} /></div>
                                        <div>{result.label}<br />
                                            <span className='bookmark-dropdown-text'>{result.lat}, {result.lng}, {result.zoom}</span>
                                        </div>
                                    </MenuItem>;
                        })}
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
