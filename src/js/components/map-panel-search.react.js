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
import { config } from '../config';

const SEARCH_THROTTLE = 300; // in ms, time to wait before repeating a request
let latlngLabelPrecision = 4;
let maxReqTimestampRendered = new Date().getTime();

function getSuggestionValue(suggestion) {
    console.log("Suggestions is: " + suggestions)
    return suggestion.name ;
}

function renderSuggestion(suggestion) {
  return (
    <span>{suggestion}</span>
  );
}

export default class MapPanelSearch extends React.Component {
    makeRequest(endpoint) {
        debounce(httpGet(endpoint, (err, res) => {
            if (err) {
                console.error(err);
            }
            else {
                this.showResults(JSON.parse(res));
            }
        }), SEARCH_THROTTLE);
    }

    showResults(results) {
        const features = results.features;

        // // Ignore requests that started before a request which has already
        // // been successfully rendered on to the UI.
        // if (results.geocoding.timestamp < maxReqTimestampRendered) {
        //     return;
        // }
        //
        // // Store the latest timestamp of the last request
        // maxReqTimestampRendered = results.geocoding.timestamp;

        let list = [] ;
        for (let i = 0, j = features.length; i < j; i++) {
            list.push(features[i].properties.label) ;
        }

        this.setState({
          results: features,
          suggestions: list
        });

    }

    // Get autocomplete suggestions
    autocomplete(query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;
        this.makeRequest(endpoint);
    }


    getSuggestions(value) {
        const query = value.trim() ;
        if (query.length >= 2) {
            this.autocomplete(value) ;
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            location: 'Cuartos, Mexico',
            latlng: '40.7148, -73.9218',
            value: '',
            suggestions: [],
            results: []
        };

        this.onChange = this.onChange.bind(this);
        //this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
    }

    componentDidMount() {
        this.setCurrentLatLng(map.getCenter());
        console.log(this.state.location) ;
    }

    setCurrentLatLng(latlng) {
        this.setState({ latlng: `${latlng.lat.toFixed(latlngLabelPrecision)}, ${latlng.lng.toFixed(latlngLabelPrecision)}` });
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
                this.setState({ location: 'Unknown location' });
            }
            else {
                this.setState({ location: response.features[0].properties.label });
            }
        }), SEARCH_THROTTLE);
    }

    onChange(event, { newValue }) {
        this.setState({
          value: newValue
        });

        this.getSuggestions(newValue) ;
    }

    render() {
        const { value, suggestions } = this.state;
        const inputProps = {
          placeholder: 'Cuartos, Mexico',
          value,
          onChange: this.onChange
        };

        return (
            <ButtonGroup id='buttons-search'>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                    <Button> <Icon type={'bt-search'} /> </Button>
                </OverlayTrigger>
                <Autosuggest className='map-search-input' suggestions={suggestions}
                   getSuggestionValue={getSuggestionValue}
                   renderSuggestion={renderSuggestion}
                   inputProps={inputProps} />
                <div className='map-search-latlng'>{this.state.latlng}</div>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                    <Button> <Icon type={'bt-star'} /> </Button>
                </OverlayTrigger>
            </ButtonGroup>
        );
    }
}
