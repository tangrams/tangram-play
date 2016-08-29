import React from 'react';
import Map from './Map';
import Editor from './Editor';
import RefreshButton from './RefreshButton';

import { initTangramPlay } from '../tangram-play';
import { initDivider } from '../ui/divider';

/**
 * This class is identical to normal Tangram Play but represents an embedded version of the app
 */
export default class AppEmbedded extends React.Component {
    componentDidMount () {
        initTangramPlay();

        // This is called here because right now divider position relies on
        // editor and map being set up already
        initDivider();
    }

    shouldComponentUpdate () {
        return false;
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
                <RefreshButton />
            </div>
        );
    }
}
