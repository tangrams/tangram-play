import React from 'react';
import ReactDOM from 'react-dom';
import MenuBar from './MenuBar';
import MapPanel from './MapPanel';
import Shield from '../ui/Shield';
import FileDrop from '../file/FileDrop';
// import ColorPalette from './ColorPalette';

import { initTangramPlay } from '../tangram-play';
import { initDivider } from '../ui/divider';

export default class App extends React.Component {
    componentDidMount () {
        initTangramPlay();

        // This is called here because right now divider position relies on
        // editor and map being set up already
        initDivider();

        // This is not ported yet. Adding this directly to the React component
        // causes a timer error to occur in the console.
        // TODO: Figure this out later. It may have to do with timing of when
        // the map itself is initiated.
        let mountNode2 = document.getElementById('map-panel');
        ReactDOM.render(<MapPanel />, mountNode2);
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
                    {/* <ColorPalette /> */}
                </div>

                <div className='overlay-container'>
                    <Shield />
                    <FileDrop />
                    <div id='modal-container' className='modal-container' />
                </div>
            </div>
        );
    }
}
