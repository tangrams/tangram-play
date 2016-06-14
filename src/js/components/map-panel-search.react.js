import React from 'react';

import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
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

let makeRequest = debounce(function (endpoint) {
    httpGet(endpoint, (err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log(JSON.parse(res)) ;
            //showResults(JSON.parse(res));
        }
    });
}, SEARCH_THROTTLE);

export default class MapPanelSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            location: 'Cuartos, Mexico',
            latlng: '40.7148, -73.9218'
        };

        this.handleChange = this.handleChange.bind(this);
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

    handleChange(e) {
        var query = e.target.value.trim() ;
        this.setState({location: query})
        if (query.length >= 2) {
            this.autocomplete(query);
        }
    }

    // Get autocomplete suggestions
    autocomplete(query) {
        const center = map.getCenter();
        const endpoint = `//${config.SEARCH.HOST}/v1/autocomplete?text=${query}&focus.point.lat=${center.lat}&focus.point.lon=${center.lng}&layers=coarse&api_key=${config.SEARCH.API_KEY}`;
        makeRequest(endpoint);
    }

    render() {
        return (
            <ButtonGroup id='buttons-search'>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                    <Button> <Icon type={'bt-search'} /> </Button>
                </OverlayTrigger>
                <input className='map-search-input' onChange={this.handleChange} placeholder={this.state.location} spellcheck='false'></input>
                <div className='map-search-latlng'>{this.state.latlng}</div>
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                    <Button> <Icon type={'bt-star'} /> </Button>
                </OverlayTrigger>
            </ButtonGroup>
        );
    }
}
