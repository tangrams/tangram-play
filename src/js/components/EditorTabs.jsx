import React from 'react';
import { connect } from 'react-redux';
import { SET_ACTIVE_FILE, REMOVE_FILE } from '../store/actions';

class EditorTabs extends React.PureComponent {
    setActiveTab(index, event) {
        if (this.props.activeTab !== index) {
            console.log('setting active tab', index);
            this.props.setActiveFile(index);
        } else {
            console.log('already active', index);
        }
    }

    closeTab(index, event) {
        // Prevent bubbling of event to clicking on tab
        event.stopPropagation();

        // Dispatches remove event to store
        this.props.removeFile(index);
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
};

EditorTabs.defaultProps = {
    files: [],
};

function mapStateToProps(state) {
    return {
        activeTab: state.files.activeFileIndex,
        files: state.files.files,
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
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorTabs);
