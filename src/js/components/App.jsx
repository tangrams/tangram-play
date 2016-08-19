import React from 'react';
import Map from './Map';
import Editor from './Editor';
import MenuBar from './MenuBar';
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

                    <Map />

                    <div className='divider' id='divider'>
                        <span className='divider-affordance' />
                    </div>

                    <Editor />

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
