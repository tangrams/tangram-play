/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { connect } from 'react-redux';
import Icon from './Icon';
import {
  SET_ACTIVE_FILE,
  REMOVE_FILE,
  CLOSE_SCENE,
  SET_FILE_METADATA,
  STASH_DOCUMENT,
} from '../store/actions';
import { editor } from '../editor/editor';
import { checkSaveStateOfDocumentThen } from '../editor/io';
import { getAllHighlightedLines } from '../editor/highlight';

class EditorTabs extends React.PureComponent {
  setActiveTab(index, event) {
    // Only switch tabs if the clicked tab is not the current tab.
    // If the tab is already active, don't do anything.
    if (this.props.activeTab !== index) {
      // Stash the current doc in store
      const currentIndex = this.props.activeTab;
      const currentDoc = editor.getDoc();
      this.props.stashDoc(currentIndex, currentDoc);

      // Stash things we want to restore: cursor, selections, highlighted lines,
      // and scroll position.
      this.props.setFileMetadata(currentIndex, {
        cursor: currentDoc.getCursor(),
        scrollInfo: editor.getScrollInfo(),
        highlightedLines: getAllHighlightedLines(),
        selections: currentDoc.listSelections(),
      });

      // Sets the next active tab
      this.props.setActiveFile(index);
    }
  }

  closeTab(index, event) {
    // Prevent bubbling of event to clicking on tab
    event.stopPropagation();

    // Dispatches remove event to store - after checking doc dirty state
    // TODO: this needs to check WHICH document, not just the one currently
    // in the editor, because closeTab() can be called on a document not
    // currently in the editor.
    checkSaveStateOfDocumentThen(index, () => {
      // If index = 0, it's the main file, so we close the scene.
      if (index === 0) {
        this.props.closeScene();
      } else {
        this.props.removeFile(index);
      }
    });
  }

  render() {
    let saveStateMessage = '';

    let dirtyTab = false;
    for (let i = 0; i < this.props.files.length; i++) {
      if (this.props.files[i].isClean === false) {
        dirtyTab = true;
      }
    }
    if (dirtyTab) {
      saveStateMessage = 'You have unsaved changes.';
    }
    if (this.props.saved === true) {
      saveStateMessage = 'All changes saved.';
    }

    return (
      <div className="editor-tabs">
        {this.props.files.map((item, i) => {
          let classes = 'editor-tab';

          // Set classes on tab based on properties of the file
          if (i === this.props.mainTab) {
            classes += ' editor-tab-is-main';
          }
          if (i === this.props.activeTab) {
            classes += ' editor-tab-is-active';
          }
          if (item.isClean === false) {
            classes += ' editor-tab-is-dirty';
          }

          // The main tab (root scene file) is not closeable right now
          let closeButtonEl;
          if (i !== this.props.mainTab) {
            closeButtonEl = (
              <div className="editor-tab-close" onClick={(e) => { this.closeTab(i, e); }}>×</div>
            );
          }

          let fileIcon;
          if (item.readOnly === true) {
            fileIcon = <Icon type="bt-lock" className="editor-tab-read-only" />;
          }

          return (
            <div className={classes} key={i} onClick={(e) => { this.setActiveTab(i, e); }}>
              <div className="editor-tab-label" style={{ lineHeight: '16px' }}>
                {fileIcon}
                {item.filename || 'untitled'}
              </div>
              <div className="editor-tab-dirty">○</div>
              {closeButtonEl}
            </div>
          );
        })}

        <div className="editor-save-state-notification">
          {saveStateMessage}
        </div>
      </div>
    );
  }
}

EditorTabs.propTypes = {
  // Injected by `mapStateToProps`
  activeTab: React.PropTypes.number,
  mainTab: React.PropTypes.number,
  files: React.PropTypes.arrayOf(React.PropTypes.object),
  saved: React.PropTypes.bool.isRequired,

  // Injected by `mapDispatchToProps`
  setActiveFile: React.PropTypes.func.isRequired,
  removeFile: React.PropTypes.func.isRequired,
  closeScene: React.PropTypes.func.isRequired,
  setFileMetadata: React.PropTypes.func.isRequired,
  stashDoc: React.PropTypes.func.isRequired,
};

EditorTabs.defaultProps = {
  activeTab: 0,
  mainTab: 0,
  files: [],
};

function mapStateToProps(state) {
  return {
    activeTab: state.scene.activeFileIndex,
    mainTab: state.scene.rootFileIndex,
    files: state.scene.files,
    saved: state.scene.saved,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setActiveFile: (index) => {
      dispatch({
        type: SET_ACTIVE_FILE,
        index,
      });
    },
    removeFile: (index) => {
      dispatch({
        type: REMOVE_FILE,
        index,
      });
    },
    closeScene: (index) => {
      dispatch({ type: CLOSE_SCENE });
    },
    setFileMetadata: (index, data) => {
      dispatch({
        ...data,
        type: SET_FILE_METADATA,
        fileIndex: index,
      });
    },
    stashDoc: (index, buffer) => {
      dispatch({
        type: STASH_DOCUMENT,
        index,
        // We are also updating contents, which seems to lag behind otherwise
        contents: buffer.getValue(),
        buffer,
      });
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorTabs);
