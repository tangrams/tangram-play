import React from 'react';
// import DocsPanel from './DocsPanel';
import { initEditor } from '../editor/editor';

export default class Editor extends React.Component {
    componentDidMount () {
        // instantiate CodeMirror with the editor container element's
        // DOM node reference
        initEditor(this.editorEl);

        // DocsPanel is temporarily disabled.
        // this.docsPanel.init();
    }

    render () {
        return (
            /* id='content' is used only as a hook for Divider right now */
            <div className='editor-container' id='content'>
                <div className='editor-container-child'>
                    <div className='editor' id='editor' ref={(ref) => { this.editorEl = ref; }} />
                    {/* <DocsPanel ref={(ref) => { this.docsPanel = ref; }} /> */}
                </div>
            </div>
        );
    }
}
