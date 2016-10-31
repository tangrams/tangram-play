import React from 'react';
import { connect } from 'react-redux';
import EditorTabs from './EditorTabs';
import EditorCallToAction from './EditorCallToAction';
import IconButton from './IconButton';
import DocsPanel from './DocsPanel';
import Divider from './Divider';

// Import Redux
import store from '../store';
import { SET_SETTINGS } from '../store/actions';

// Import editor logic
import {
  initEditor,
  editor,
  createCodeMirrorDoc,
  setEditorContent,
  clearEditorContent,
  watchEditorForChanges,
}
from '../editor/editor';
import { highlightRanges } from '../editor/highlight';

let docsHasInitAlready = false;

class Editor extends React.PureComponent {
  componentDidMount() {
    // instantiate CodeMirror with the editor container element's
    // DOM node reference
    initEditor(this.editorEl);

    // Turn change watching on.
    editor.on('changes', watchEditorForChanges);
  }

  componentDidUpdate(prevProps, prevState) {
    // Set content of editor based on currently active file.
    // When incoming props for file content changes we set the state
    // of the editor directly. This only runs if the scene has changed, or
    // if the active tab has changed.
    if ((this.props.sceneCounter > prevProps.sceneCounter) ||
      (this.props.activeFile !== prevProps.activeFile)) {
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

            // Restore cursor state
            if (activeFile.cursor) {
              console.log(activeFile.cursor);
              editor.getDoc().setCursor(activeFile.cursor);
            }

            // TODO: Restore selected areas, if any (supercedes cursor).
            // TODO: Restore highlighted lines, if any.
            // Otherwise we use its text-value `contents` property and
            // other state properties, if present.
          } else if (activeFile.contents) {
            // Use the text content and (TODO: reparse)
            const doc = createCodeMirrorDoc(activeFile.contents);
            setEditorContent(doc, activeFile.readOnly);
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

          if (window.isEmbedded === undefined) {
            // Restore cursor position, if provided.
            if (activeFile.cursor) {
              editor.getDoc().setCursor(activeFile.cursor, {
                scroll: false,
              });
            }
          }
        }
      }

      // Turn change watching back on.
      editor.on('changes', watchEditorForChanges);
    }

    // DocsPanel is only available behind an admin flag.
    // Update after props have determined sign-in, and init docsPanel.
    // Only do this once.
    if (!docsHasInitAlready && this.props.admin) {
      this.docsPanel.init();
      docsHasInitAlready = true;
    }
  }

  /**
   * Hides the editor pane.
   * This does so really simply; it updates the position of the divider to the
   * current window width (to make it go as far to the right as possible).
   * The Divider component will take care of the rest.
   */
  onClickHideEditor(event) {
    store.dispatch({
      type: SET_SETTINGS,
      dividerPositionX: window.innerWidth,
    });
  }

  render() {
    const customStyles = {};
    if (this.props.fontSize) {
      customStyles.fontSize = `${this.props.fontSize.toString()}px`;
    }

    return (
      /* id='content' is used only as a hook for Divider right now */
      <div className="editor-container" id="content">
        <Divider />
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
        <EditorTabs />
        <IconButton
          className="editor-collapse-button"
          icon="bt-caret-right"
          tooltip="Hide editor"
          onClick={this.onClickHideEditor}
        />

        <div
          className="editor"
          id="editor"
          ref={(ref) => { this.editorEl = ref; }}
          style={customStyles}
        />

        {(() => {
          if (this.props.admin) {
            return (
              <DocsPanel ref={(ref) => { this.docsPanel = ref; }} />
            );
          }
          return null;
        })()}
      </div>
    );
  }
}

Editor.propTypes = {
  admin: React.PropTypes.bool,
  sceneCounter: React.PropTypes.number,
  activeFile: React.PropTypes.number,
  files: React.PropTypes.array,
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
