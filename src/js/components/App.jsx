import React from 'react';
import Map from './Map';
import Editor from './Editor';
import MenuBar from './MenuBar';
import Shield from '../ui/Shield';
import FileDrop from '../file/FileDrop';
// import ColorPalette from './ColorPalette';

import { initTangramPlay } from '../tangram-play';

export default class App extends React.Component {
    componentDidMount () {
        initTangramPlay();
    }

    shouldComponentUpdate () {
        return false;
    }

    render () {
        return (
            <div>
                <MenuBar />

                <div className="workspace-container">
                    <div id="draggable-container">
                        <div id="draggable-container-child">
                        </div>
                    </div>

                    <div>
                        <Map />
                        <Editor />
                    </div>

                    <div id="widget-links" />
                    {/* <ColorPalette /> */}
                </div>

                <div className="overlay-container">
                    <Shield />
                    <FileDrop />
                    <div id="modal-container" className="modal-container" />
                </div>
            </div>
        );
    }
}
