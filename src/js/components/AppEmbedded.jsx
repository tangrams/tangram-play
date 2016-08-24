import React from 'react';
import Map from './Map';
import Editor from './Editor';
// import ColorPalette from './ColorPalette';

import { initTangramPlay } from '../tangram-play';
import { initDivider } from '../ui/divider';

export default class AppEmbedded extends React.Component {
    componentDidMount () {
        initTangramPlay();

        // This is called here because right now divider position relies on
        // editor and map being set up already
        initDivider();
    }

    render () {
        return (
            <div className='workspace-container'>
                <div id='draggable-container'>
                    <div id='draggable-container-child'>
                    </div>
                </div>

                <Map panel={false} />

                <div className='divider' id='divider'>
                    <span className='divider-affordance' />
                </div>

                <Editor />
            </div>
        );
    }
}
