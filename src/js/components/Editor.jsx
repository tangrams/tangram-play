import React from 'react';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';
import EditorTabs from './EditorTabs';
import EditorCallToAction from './EditorCallToAction';
import IconButton from './IconButton';
import DocsPanel from './DocsPanel';
import { setDividerPosition } from './Divider';

// Redux
import { SET_APP_STATE } from '../store/actions';

// Import editor logic
import {
  initEditor,
  editor,
  createCodeMirrorDoc,
  setEditorContent,
  clearEditorContent,
  watchEditorForChanges,
  refreshEditor,
}
from '../editor/editor';
import { highlightRanges } from '../editor/highlight';

class Editor extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onClickHideEditor = this.onClickHideEditor.bind(this);
  }

  componentDidMount() {
    // instantiate CodeMirror with the editor container element's
    // DOM node reference
    initEditor(this.editorEl);
    editor.on('changes', watchEditorForChanges);

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

          // Editor must have focus or the cursor won't show up.
          editor.focus();
        }
      }

      // Turn change watching back on.
      editor.on('changes', watchEditorForChanges);
    }
  }

  /**
   * Hides the editor pane.
   * There is no special "flag" for hidden; it requests the Divider component
   * to update its position to the full window width (as far right as possible).
   * The Divider component will take care of the rest.
   */
  onClickHideEditor(event) {
    setDividerPosition(window.innerWidth);
    this.props.dispatch({
      type: SET_APP_STATE,
      showEditorHiddenTooltip: true,
    });
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

        <div className="editor-tab-bar">
          <EditorTabs />
          <IconButton
            className="editor-collapse-button"
            icon="bt-caret-right"
            tooltip="Hide editor"
            onClick={this.onClickHideEditor}
          />
        </div>

        <div
          className="editor"
          id="editor"
          ref={(ref) => { this.editorEl = ref; }}
          style={customStyles}
        />

        {(() => {
          if (this.props.admin) {
            return (
              <DocsPanel />
            );
          }
          return null;
        })()}
      </div>
    );
  }
}

Editor.propTypes = {
  dispatch: React.PropTypes.func,
  admin: React.PropTypes.bool,
  sceneCounter: React.PropTypes.number,
  activeFile: React.PropTypes.number,
  files: React.PropTypes.arrayOf(React.PropTypes.object),
  appInitialized: React.PropTypes.bool,
  fontSize: React.PropTypes.number,
};

Editor.defaultProps = {
  admin: false,
  activeFile: -1,
  files: [],
};

function mapStateToProps(state) {
  return {
    admin: state.user.admin || false,
    sceneCounter: state.scene.counter,
    activeFile: state.scene.activeFileIndex,
    files: state.scene.files,
    appInitialized: state.app.initialized,
    fontSize: state.settings.editorFontSize,
  };
}

export default connect(mapStateToProps)(Editor);
