import React from 'react';

export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        };
    }

    render() {
        return (
            <div className='map-container' id='map-container'>
                <div className='map-view' id='map'></div>

                <div className='map-toolbar map-toolbar-collapsed' data-tooltip='Toggle map toolbar' data-tooltip-alignment='right'>
                  <div className='map-toolbar-button'>
                      <i className='btm bt-globe'></i>
                  </div>
                  <div className='map-toolbar-toggle'></div>
              </div>

                <div className='map-toolbar map-toolbar-bar' id='map-toolbar'>
                    <div className='map-zoom'>
                        <div className='map-zoom-indicator'>z&#8202;<span className='map-zoom-quantity'></span></div>
                        <button className='map-zoom-in' id='zoom-in' data-tooltip='Zoom in'><i className='btm bt-plus'></i></button>
                        <button className='map-zoom-out' id='zoom-out' data-tooltip='Zoom out'><i className='btm bt-minus'></i></button>
                    </div>
                    <div className='map-location-bar'>
                        <div className='map-search-icon' data-tooltip='Search for location'><i className='btm bt-search'></i></div>
                        <input className='map-search-input' placeholder='' spellcheck='false'></input>
                        <div className='map-latlng-label'></div>
                        <div className='map-save-icon' data-tooltip='Bookmark location' data-tooltip-alignment='right'><i className='btm bt-star'></i></div>
                        <div className='map-bookmarks'>
                            <button className='map-bookmarks-button' id='bookmarks' data-tooltip='Bookmarks' data-tooltip-alignment='right'>
                                <i className='btm bt-bookmark'></i>
                            </button>
                            <div className='map-bookmarks-menu'></div>
                        </div>
                        <div className='map-search-results'></div>
                    </div>
                    <div className='geolocator'>
                        <button className='geolocator-button' id='geolocator' data-tooltip='Locate me' data-tooltip-alignment='right'>
                            <i className='btm bt-map-arrow'></i>
                            <i className='btm bt-sync bt-spin'></i>
                        </button>
                    </div>
                    <div className='map-toolbar-toggle' id='map-toolbar-toggle' data-tooltip='Toogle map toolbar' data-tooltip-alignment='right'></div>
                </div>
                <div className='map-loading' id='map-loading'></div>
            </div>
        );
    }

    componentDidMount() {
    }
}
