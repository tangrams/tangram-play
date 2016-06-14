import React from 'react';

import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './icon.react';
import MapPanelSearch from './map-panel-search.react';

// import LocalStorage from '../storage/localstorage';
import { map } from '../map/map';
// import search from '../map/search';
// import { initGeolocator } from '../map/geolocator';
// import bookmarks from '../map/bookmarks';

// const STORAGE_DISPLAY_KEY = 'map-toolbar-display';
// const MAP_UPDATE_DELTA = 0.002;

let el;
// let currentLocation;

function setZoomLabel () {
    let label = el.querySelector('.map-zoom-quantity');
    let currentZoom = map.getZoom();
    let fractionalNumber = Math.floor(currentZoom * 10) / 10;
    label.textContent = fractionalNumber.toFixed(1);
}

const clickZoomIn = function () {
    map.zoomIn(1, { animate: true });
    setZoomLabel();
};

const clickZoomOut = function () {
    map.zoomOut(1, { animate: true });
    setZoomLabel();
};

export default class MapPanel extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            open: true
        };
        this.toggleMapPanel = this.toggleMapPanel.bind(this);
    }

    componentDidMount () {
        // search.init();
        // initGeolocator();
        // bookmarks.init();
        // setZoomLabel();
        //
        // currentLocation = map.getCenter();
        // search.setCurrentLatLng(currentLocation);
        // search.reverseGeocode(currentLocation);
    }

    toggleMapPanel () {
        this.setState({ open: !this.state.open });
    }

    render () {
        return (
            <div>
                {/* Toggle map panel to show it*/}
                <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Toogle map toolbar'}</Tooltip>}>
                    <Button onClick={this.toggleMapPanel} className='map-panel-button-show'>
                        <Icon type={'bt-caret-down'} />
                    </Button>
                </OverlayTrigger>

                {/* Map panel*/}
                <Panel collapsible expanded={this.state.open} className='map-panel-collapsible'>
                    <div className='map-panel-toolbar'>
                        <div>z&#8202;<span></span></div>

                        {/* Zoom buttons*/}
                        <ButtonGroup id='buttons-plusminus'>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom in'}</Tooltip>}>
                                <Button onClick={clickZoomIn}> <Icon type={'bt-plus'} /> </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom out'}</Tooltip>}>
                                <Button onClick={clickZoomOut}> <Icon type={'bt-minus'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Search buttons*/}
                        <MapPanelSearch />

                        {/* Bookmark button*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmarks'}</Tooltip>}>
                                <Button> <Icon type={'bt-bookmark'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Locate me button*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Locate me'}</Tooltip>}>
                                <Button> <Icon type={'bt-map-arrow'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/* Toggle map panel to show it*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Toggle map toolbar'}</Tooltip>}>
                                <Button onClick={this.toggleMapPanel}> <Icon type={'bt-caret-up'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>
                    </div>
                </Panel>
            </div>
        );
    }
}
