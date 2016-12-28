import React from 'react';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';
import EditorTabBar from './EditorTabBar';
import EditorCallToAction from './EditorCallToAction';
import EditorContextMenu from './EditorContextMenu';
import DocsPanel from './DocsPanel';

// Import editor logic
import {
  initEditor,
  editor,
  createCodeMirrorDoc,
  setEditorContent,
  clearEditorContent,
  watchEditorForChanges,
  refreshEditor,
  debouncedUpdateLocalMemory,
}
from '../editor/editor';
import { highlightRanges } from '../editor/highlight';

class Editor extends React.PureComponent {
  componentDidMount() {
    // instantiate CodeMirror with the editor container element's DOM node ref
    initEditor(this.editorEl);
    editor.on('changes', watchEditorForChanges);

    // Watch for cursor or viewport change activities. Autosave this state
    // so it can be restored if page is reloaded.
    editor.on('cursorActivity', debouncedUpdateLocalMemory);
    editor.on('viewportChange', debouncedUpdateLocalMemory);

    // Broadcast editor state ready to other componentClass
    EventEmitter.dispatch('editor:ready');

    // CodeMirror instance must refresh when editor pane is resized.
    EventEmitter.subscribe('divider:reposition', refreshEditor);
  }

  componentDidUpdate(prevProps, prevState) {
    // Set content of editor based on currently active file.
    // When incoming props for file content changes we set the state
    // of the editor directly. This only runs if the scene has changed, or
    // if the active tab has changed, or the number of files is less than
    // before (which handles when a file has been removed).
    if ((this.props.sceneCounter > prevProps.sceneCounter) ||
      (this.props.activeFile !== prevProps.activeFile) ||
      (this.props.files.length < prevProps.files.length)) {
      // Turn off watching for changes in editor.
      editor.off('changes', watchEditorForChanges);

      // If no active file, clear editor buffer.
      if (this.props.activeFile < 0) {
        clearEditorContent();
      } else {
        const activeFile = this.props.files[this.props.activeFile];

        // If there is an active CodeMirror document buffer, we swap out the document.
        if (activeFile) {
          if (activeFile.buffer) {
            setEditorContent(activeFile.buffer, activeFile.readOnly);
          } else if (activeFile.contents) {
            // Otherwise we use its text-value `contents` property
            // (TODO: reparse)
            const doc = createCodeMirrorDoc(activeFile.contents);
            setEditorContent(doc, activeFile.readOnly);
          }

          // Restore cursor state
          if (activeFile.cursor) {
            editor.getDoc().setCursor(activeFile.cursor, {
              scroll: false,
            });
          }

          // Restore selected areas, if any (supercedes cursor).
          if (activeFile.selections) {
            editor.getDoc().setSelections(activeFile.selections);
          }

          // Highlights lines, if provided.
          if (activeFile.highlightedLines) {
            highlightRanges(activeFile.highlightedLines);
          }

          // Restores the part of the document that was scrolled to, if provided.
          if (activeFile.scrollInfo) {
            const left = activeFile.scrollInfo.left || 0;
            const top = activeFile.scrollInfo.top || 0;
            editor.scrollTo(left, top);
          }

          // Switching the document won't give it focus automatically.
          // Editor must be given focus or the cursor won't show up.
          // Only put focus on editor if the document itself is in focus.
          // Documents may not be in focus if they are iframed, and focusing
          // the editor will also cause the document to focus, which can cause
          // a page to jump to the iframe unexpectedly.
          if (document.hasFocus()) {
            editor.focus();
          }

          // Fix word wrapping not working correctly
          editor.refresh();

          // Autosave editor state
          debouncedUpdateLocalMemory();
        }
      }

      // Turn change watching back on.
      editor.on('changes', watchEditorForChanges);
    }
  }

  render() {
    const customStyles = {};
    if (this.props.fontSize) {
      customStyles.fontSize = `${this.props.fontSize.toString()}px`;
    }

    return (
      <div className="editor-container">
        {(() => {
          // Don't flash this when Tangram Play is initializing;
          // files are still zero, but we won't prompt until after
          if (!this.props.appInitialized) return null;

          if (this.props.files.length === 0) {
            return (
              <EditorCallToAction />
            );
          }
          return null;
        })()}

        <EditorTabBar />

        <div
          className="editor"
          id="editor"
          ref={(ref) => { this.editorEl = ref; }}
          style={customStyles}
        />

        <EditorContextMenu />
        <DocsPanel />
      </div>
    );
  }
}

Editor.propTypes = {
  sceneCounter: React.PropTypes.number,
  activeFile: React.PropTypes.number,
  files: React.PropTypes.arrayOf(React.PropTypes.object),
  appInitialized: React.PropTypes.bool,
  fontSize: React.PropTypes.number,
};

Editor.defaultProps = {
  activeFile: -1,
  files: [],
};

function mapStateToProps(state) {
  return {
    sceneCounter: state.scene.counter,
    activeFile: state.scene.activeFileIndex,
    files: state.scene.files,
    appInitialized: state.app.initialized,
    fontSize: state.settings.editorFontSize,
  };
}

export default connect(mapStateToProps)(Editor);
