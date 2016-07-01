import React from 'react';
import Icon from '../components/icon.react';
import EditorIO from '../editor/io';

export default class FileDrop extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            visibleFileDropArea: false
        };

        this._onDragEnter = this._onDragEnter.bind(this);
        this._onDragOver = this._onDragOver.bind(this);
        this._onDragLeave = this._onDragLeave.bind(this);
        this._onDrop = this._onDrop.bind(this);
    }

    render () {
        const displayStyle = this.state.visibleFileDropArea
            ? { display: 'block' }
            : { display: 'none' };

        return (
            <div className='filedrop-container' onDragEnter={this._onDragEnter} onDragLeave={this._onDragLeave} onDrop={this._onDrop} style={displayStyle}>
                <div className='filedrop-indicator'>
                    <div className='filedrop-icon'>
                        <Icon type={'bt-upload'} />
                    </div>
                    <div className='filedrop-label'>Drop a file here to open</div>
                </div>
            </div>
        );
    }

    // Set up drag/drop file event listeners to the window`
    componentWillMount () {
        // Capturing events here prevents them from getting delivered to CodeMirror
        // or resulting in a file navigation
        window.addEventListener('dragenter', this._onDragEnter, true);
        window.addEventListener('dragover', this._onDragOver, true);
        window.addEventListener('drop', this._handleDropOnWindow, true);
    }

    // This handler is added to the window during the componentWillMount step
    _onDragEnter (event) {
        // Check to make sure that dropped items are files.
        // This prevents other drags (e.g. text in editor)
        // from turning on the file drop area.
        // See here: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
        // Tested in Chrome, Firefox, Safari 8
        const types = event.dataTransfer.types;
        if (types !== null && ((types.indexOf) ? (types.indexOf('Files') !== -1) : types.contains('application/x-moz-file'))) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.setState({ visibleFileDropArea: true });
        }
    }

    // Required to prevent browser from navigating to a file
    // instead of receiving a data transfer
    _handleDropOnWindow (event) {
        event.preventDefault();
    }

    // This handler is added to the drop area when it is rendered
    _onDragOver (event) {
        // Required to prevent browser from navigating to a file
        // instead of receiving a data transfer
        event.preventDefault();

        // On Mac + Chrome, drag-and-dropping a scene file from the downloads bar
        // will silently fail. The drop event is never fired on the drop area.
        // This issue is tracked here: https://github.com/tangrams/tangram-play/issues/228
        // The Chrome bug is tracked here:
        // https://code.google.com/p/chromium/issues/detail?id=234931
        // Based on a comment in that thread, manually setting the dropEffect in this
        // way will solve this problem.
        const effect = event.dataTransfer && event.dataTransfer.dropEffect;
        const effectAllowed = event.dataTransfer && event.dataTransfer.effectAllowed;
        if (effect !== 'none' || effectAllowed === 'none') {
            return;
        }
        event.dataTransfer.dropEffect = 'copy';
    }

    _onDragLeave (event) {
        event.preventDefault();
        this.setState({ visibleFileDropArea: false });
    }

    _onDrop (event) {
        event.preventDefault();
        this.setState({ visibleFileDropArea: false });
        this._handleFiles(event.dataTransfer.files);
    }

    _handleFiles (files) {
        if (files.length > 0) {
            const file = files[0];
            EditorIO.open(file);
        }
    }
}
