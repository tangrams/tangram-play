import React from 'react';
import { connect } from 'react-redux';
import { SET_ACTIVE_FILE, REMOVE_FILE, CLOSE_SCENE, STASH_DOCUMENT } from '../store/actions';
import { editor } from '../editor/editor';
import EditorIO from '../editor/io';

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
        EditorIO.checkSaveStateThen(() => {
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
                    if (item.is_clean === false) {
                        classes += ' editor-tab-is-dirty';
                    }

                    /* eslint-disable react/jsx-no-bind */
                    // We need it to pass the index to handler functions.
                    return (
                        <div className={classes} key={i} onClick={this.setActiveTab.bind(this, i)}>
                            <div className="editor-tab-label">{item.filename || 'untitled'}</div>
                            <div className="editor-tab-dirty">○</div>
                            <div className="editor-tab-close" onClick={this.closeTab.bind(this, i)}>×</div>
                        </div>
                    );
                    /* eslint-enable react/jsx-no-bind */
                })}
            </div>
        );
    }
}

EditorTabs.propTypes = {
    // Injected by `mapStateToProps`
    activeTab: React.PropTypes.number,
    files: React.PropTypes.array,

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
