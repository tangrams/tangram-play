import React from 'react';
import ReactDOM from 'react-dom';
import MenuBar from './MenuBar';
import MapPanel from './MapPanel';
import OverlaysContainer from '../ui/OverlaysContainer';
// import ColorPalette from './ColorPalette';

import { initTangramPlay } from '../tangram-play';
import { initDivider } from '../ui/divider';

export default class App extends React.Component {
    componentDidMount () {
        initTangramPlay();

        // This is called here because right now divider position relies on
        // editor and map being set up already
        initDivider();

        let mountNode2 = document.getElementById('map-panel');
        ReactDOM.render(<MapPanel />, mountNode2);

        let mountNode3 = document.getElementById('overlays-container');
        ReactDOM.render(<OverlaysContainer />, mountNode3);

        // let mountNode4 = document.getElementsByClassName('colorpalette');
        // ReactDOM.render(<ColorPalette />, mountNode4[0]);
    }

    render () {
        return (
            <div>
                <MenuBar />

                <div className='workspace-container'>
                    <div id='draggable-container'>
                        <div id='draggable-container-child'>
                        </div>
                    </div>

                    <div className='map-container' id='map-container'>
                        <div className='map-view' id='map' />
                        <div className='map-loading' id='map-loading' />
                        <div className='map-panel' id='map-panel' />
                        <div id='map-inspection-components' />
                    </div>

                    <div className='divider' id='divider'>
                        <span className='divider-affordance' />
                    </div>

                    <div className='editor-container' id='content'>
                        <div className='editor' id='editor' />
                    </div>

                    <div id='widget-links' />
                    <div className='colorpalette' />
                </div>

                <div id='overlays-container' className='overlay-container' />
            </div>
        );
    }
}
