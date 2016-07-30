import React from 'react';
import Shield from './Shield';
import FileDrop from '../file/FileDrop';

// Container to transition from old HTML-based #overlays-container element.
export default class OverlaysContainer extends React.Component {
    render () {
        return (
            <div>
                <Shield />
                <FileDrop />
                <div id='modal-container'></div>
            </div>
        );
    }
}
