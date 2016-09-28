import React from 'react';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import DocsPanel from './DocsPanel';
import { initEditor } from '../editor/editor';
import Divider from './Divider';
import Icon from './Icon';

let docsHasInitAlready = false;

class Editor extends React.PureComponent {
    componentDidMount() {
        // instantiate CodeMirror with the editor container element's
        // DOM node reference
        initEditor(this.editorEl);
    }

    componentDidUpdate() {
        // DocsPanel is only available behind an admin flag.
        // Update after props have determined sign-in, and init docsPanel.
        // Only do this once.
        if (!docsHasInitAlready && this.props.admin) {
            this.docsPanel.init();
            docsHasInitAlready = true;
        }
    }

    render() {
        return (
            /* id='content' is used only as a hook for Divider right now */
            <div className="editor-container" id="content">
                <Divider />
                <div className="editor-tabs">
                    {this.props.files.map((item, i) => {
                        let classes = 'editor-tab';
                        if (item.is_clean === false) {
                            classes += ' editor-tab-is-dirty';
                        }

                        return (
                            <div className={classes} key={i}>
                                <div className="editor-tab-label">{item.filename || 'untitled'}</div>
                                <div className="editor-tab-dirty">○</div>
                                <div className="editor-tab-close">×</div>
                            </div>
                        );
                    })}
                    <OverlayTrigger
                        rootClose
                        placement="bottom"
                        overlay={<Tooltip id="tooltip">Hide editor</Tooltip>}
                        delayShow={200}
                    >
                        <button className="button-icon editor-collapse-button">
                            <Icon type="bt-angles-right" />
                        </button>
                    </OverlayTrigger>
                </div>
                <div className="editor" id="editor" ref={(ref) => { this.editorEl = ref; }} />
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
    files: React.PropTypes.array,
};

Editor.defaultProps = {
    admin: false,
    files: [],
};

function mapStateToProps(state) {
    return {
        admin: state.user.admin || false,
        files: state.files.files,
    };
}

export default connect(mapStateToProps)(Editor);
