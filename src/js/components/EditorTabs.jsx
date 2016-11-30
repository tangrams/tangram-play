import React from 'react';
import { connect } from 'react-redux';
import Icon from './Icon';
import { SET_ACTIVE_FILE, REMOVE_FILE, CLOSE_SCENE, STASH_DOCUMENT } from '../store/actions';
import { editor } from '../editor/editor';
import { checkSaveStateThen } from '../editor/io';

class EditorTabs extends React.PureComponent {
  setActiveTab(index, event) {
    // Only switch tabs if the clicked tab is not the current tab.
    // If the tab is already active, don't do anything.
    if (this.props.activeTab !== index) {
      // Stash the current doc in store
      const currentIndex = this.props.activeTab;
      const currentDoc = editor.getDoc();
      this.props.stashDoc(currentIndex, currentDoc);

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
    checkSaveStateThen(() => {
      // If index = 0, it's the main file, so we close the scene.
      if (index === 0) {
        this.props.closeScene();
      } else {
        this.props.removeFile(index);
      }
    });
  }

  render() {
    return (
      <div className="editor-tabs">
        {this.props.files.map((item, i) => {
          let classes = 'editor-tab';

          if (i === this.props.activeTab) {
            classes += ' editor-tab-is-active';
          }
          if (item.isClean === false) {
            classes += ' editor-tab-is-dirty';
          }

          // The main tab (root scene file) is not closeable
          let closeButtonEl;
          if (i !== this.props.mainTab) {
            closeButtonEl = (
              <div className="editor-tab-close" onClick={(e) => { this.closeTab(i, e); }}>×</div>
            );
          } else {
            classes += ' editor-tab-is-main';
          }

          let fileIcon;
          if (item.readOnly === true) {
            // TEMPORARY: emoji lock
            // TODO: consider a replacement; and remove line-height override for this
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
      </div>
    );
  }
}

EditorTabs.propTypes = {
  // Injected by `mapStateToProps`
  activeTab: React.PropTypes.number,
  mainTab: React.PropTypes.number,
  files: React.PropTypes.arrayOf(React.PropTypes.object),

  // Injected by `mapDispatchToProps`
  setActiveFile: React.PropTypes.func,
  removeFile: React.PropTypes.func,
  closeScene: React.PropTypes.func,
  stashDoc: React.PropTypes.func,
};

EditorTabs.defaultProps = {
  files: [],
};

function mapStateToProps(state) {
  return {
    activeTab: state.scene.activeFileIndex,
    mainTab: state.scene.rootFileIndex,
    files: state.scene.files,
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
    stashDoc: (index, buffer) => {
      dispatch({
        type: STASH_DOCUMENT,
        index,
        buffer,
      });
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorTabs);
