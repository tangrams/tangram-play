import localforage from 'localforage';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Icon from './Icon';
import EventEmitter from './event-emitter';

import { checkSaveStateThen, openLocalFile, newScene, exportSceneFile } from '../editor/io';
import MenuFullscreen from './MenuFullscreen';
import ConfirmDialogModal from '../modals/ConfirmDialogModal';
import ExamplesModal from '../modals/ExamplesModal';
import AboutModal from '../modals/AboutModal';
import SaveGistModal from '../modals/SaveGistModal'; // LEGACY.
import SaveToCloudModal from '../modals/SaveToCloudModal';
import OpenFromCloudModal from '../modals/OpenFromCloudModal';
import OpenGistModal from '../modals/OpenGistModal';
import OpenUrlModal from '../modals/OpenUrlModal';
import { takeScreenshot } from '../map/screenshot';
import { setGlobalIntrospection } from '../map/inspection';
import { requestUserSignInState } from '../user/sign-in';
import { openSignInWindow } from '../user/sign-in-window';
import SignInButton from './SignInButton';

function clickNew() {
    newScene();
}

function clickOpenFile() {
    openLocalFile();
}

function clickOpenGist() {
    checkSaveStateThen(() => {
        ReactDOM.render(<OpenGistModal />, document.getElementById('modal-container'));
    });
}

function clickOpenURL() {
    checkSaveStateThen(() => {
        ReactDOM.render(<OpenUrlModal />, document.getElementById('modal-container'));
    });
}

function clickOpenExample() {
    checkSaveStateThen(() => {
        ReactDOM.render(<ExamplesModal />, document.getElementById('modal-container'));
    });
}

function clickSaveFile() {
    exportSceneFile();
}

function clickSaveGist() {
    ReactDOM.render(<SaveGistModal />, document.getElementById('modal-container'));
}

function unsubscribeSaveToCloud() {
    // eslint-disable-next-line no-use-before-define
    EventEmitter.unsubscribe('mapzen:sign_in', clickSaveToCloud);
}

function showSaveToCloudModal() {
    unsubscribeSaveToCloud();
    ReactDOM.render(<SaveToCloudModal />, document.getElementById('modal-container'));
}

function clickSaveToCloud() {
    requestUserSignInState()
        .then((data) => {
            if (data.id) {
                showSaveToCloudModal();
            } else {
                ReactDOM.render(
                    <ConfirmDialogModal
                        message="You are not signed in! Please sign in now."
                        confirmCallback={openSignInWindow}
                        cancelCallback={unsubscribeSaveToCloud}
                    />,
                    document.getElementById('modal-container')
                );
                EventEmitter.subscribe('mapzen:sign_in', clickSaveToCloud);
            }
        });
}

function unsubscribeOpenFromCloud() {
    // eslint-disable-next-line no-use-before-define
    EventEmitter.unsubscribe('mapzen:sign_in', clickOpenFromCloud);
}

function showOpenFromCloudModal() {
    unsubscribeOpenFromCloud();
    checkSaveStateThen(() => {
        ReactDOM.render(<OpenFromCloudModal />, document.getElementById('modal-container'));
    });
}

function clickOpenFromCloud() {
    requestUserSignInState()
        .then((data) => {
            if (data.id) {
                showOpenFromCloudModal();
            } else {
                ReactDOM.render(
                    <ConfirmDialogModal
                        message="You are not signed in! Please sign in now."
                        confirmCallback={openSignInWindow}
                        cancelCallback={unsubscribeOpenFromCloud}
                    />,
                    document.getElementById('modal-container')
                );
                EventEmitter.subscribe('mapzen:sign_in', clickOpenFromCloud);
            }
        });
}

function clickSaveCamera() {
    takeScreenshot();
}

function clickAbout() {
    ReactDOM.render(<AboutModal />, document.getElementById('modal-container'));
}

const documentationLink = 'https://mapzen.com/documentation/tangram/';
const feedbackLink = 'https://github.com/tangrams/tangram-play/issues/';
const tutorialLink = 'https://tangrams.github.io/tangram-tutorial/';

/**
 * Represents the navbar for the application
 */
class MenuBar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inspectActive: false, // Represents whether inspect mode is on / off
            legacyGistMenu: false,
        };
        this.clickInspect = this.clickInspect.bind(this);
    }

    // Determine whether some menu items should display
    componentWillMount() {
        // Only display "Open a gist" if user has saved gists. This is a
        // legacy feature. It will be completely removed in the future.
        const STORAGE_SAVED_GISTS = 'gists';
        localforage.getItem(STORAGE_SAVED_GISTS)
            .then((gists) => {
                if (Array.isArray(gists)) {
                    this.setState({
                        legacyGistMenu: true,
                    });
                }
            });
    }

    clickInspect() {
        const isInspectActive = this.state.inspectActive;
        if (isInspectActive) {
            this.setState({ inspectActive: false });
            setGlobalIntrospection(false);
        } else {
            this.setState({ inspectActive: true });
            setGlobalIntrospection(true);
        }
    }

    render() {
        return (
            <Navbar inverse className="menu-bar">
                {/* The brand section */}
                <Navbar.Header>
                    <Navbar.Brand>
                        <span className="brand">
                            Tangram Play
                            <span className="brand-tag">BETA</span>
                        </span>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>

                <Navbar.Collapse>
                    {/* Left menu section */}
                    <Nav pullLeft>
                        {/* New button*/}
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">New scene</Tooltip>}
                            delayShow={200}
                        >
                            <NavItem eventKey="new" onClick={clickNew}>
                                <Icon type="bt-file" />New
                            </NavItem>
                        </OverlayTrigger>

                        {/* Open dropdown */}
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">Open scene</Tooltip>}
                            delayShow={200}
                        >
                            <NavDropdown
                                title={<span><Icon type="bt-upload" />Open</span>}
                                id="open-dropdown"
                            >
                                <MenuItem onClick={clickOpenFile}>
                                    <Icon type="bt-folder" />Open a file
                                </MenuItem>
                                {(() => {
                                    if (this.props.mapzenAccount) {
                                        return (
                                            <MenuItem onClick={clickOpenFromCloud}>
                                                <Icon type="bt-cloud-download" />Open from your Mapzen account
                                            </MenuItem>
                                        );
                                    }
                                    return null;
                                })()}
                                {(() => {
                                    if (this.state.legacyGistMenu) {
                                        return (
                                            <MenuItem onClick={clickOpenGist}>
                                                <Icon type="bt-code" />Open a saved Gist
                                            </MenuItem>
                                        );
                                    }
                                    return null;
                                })()}
                                <MenuItem onClick={clickOpenURL}>
                                    <Icon type="bt-link" />Open from URL
                                </MenuItem>
                                <MenuItem onClick={clickOpenExample}>
                                    <Icon type="bt-map" />Choose example
                                </MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>

                        {/* Save dropdown */}
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">Save scene</Tooltip>}
                            delayShow={200}
                        >
                            <NavDropdown
                                title={<span><Icon type="bt-download" />Save</span>}
                                id="save-dropdown"
                            >
                                <MenuItem onClick={clickSaveFile}>
                                    <Icon type="bt-folder" />Save to your computer
                                </MenuItem>
                                {(() => {
                                    if (this.props.mapzenAccount) {
                                        return (
                                            <MenuItem onClick={clickSaveToCloud}>
                                                <Icon type="bt-cloud-upload" />Save to your Mapzen account
                                            </MenuItem>
                                        );
                                    }
                                    return null;
                                })()}
                                <MenuItem onClick={clickSaveGist}>
                                    <Icon type="bt-code" />Save to Gist
                                </MenuItem>
                                <MenuItem onClick={clickSaveCamera}>
                                    <Icon type="bt-camera" />Take a screenshot
                                </MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>
                    </Nav>

                    {/* Right menu section */}
                    <Nav pullRight>
                        {/* Introspection button */}
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">Toggle inspect mode</Tooltip>}
                            delayShow={200}
                        >
                            <NavItem
                                eventKey="new"
                                onClick={this.clickInspect}
                                active={this.state.inspectActive}
                            >
                                <Icon type="bt-magic" />Inspect
                            </NavItem>
                        </OverlayTrigger>

                        {/* Fullscreen button */}
                        <MenuFullscreen />

                        {/* Help dropdown */}
                        <OverlayTrigger
                            rootClose
                            placement="bottom"
                            overlay={<Tooltip id="tooltip">Documentation and help</Tooltip>}
                            delayShow={200}
                        >
                            <NavDropdown
                                title={<span><Icon type="bt-question-circle" />Help</span>}
                                id="help-dropdown"
                            >
                                <MenuItem onClick={clickAbout}>
                                    <Icon type="bt-info-circle" />About
                                </MenuItem>
                                <MenuItem href={documentationLink} target="_blank" rel="noopener noreferrer">
                                    <Icon type="bt-book" />Documentation
                                </MenuItem>
                                <MenuItem href={tutorialLink} target="_blank" rel="noopener noreferrer">
                                    <Icon type="bt-notebook" />Tutorial
                                </MenuItem>
                                <MenuItem href={feedbackLink} target="_blank" rel="noopener noreferrer">
                                    <Icon type="bt-comments" />Feedback
                                </MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>

                        {/* Sign in */}
                        <SignInButton />
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

MenuBar.propTypes = {
    mapzenAccount: React.PropTypes.bool,
};

MenuBar.defaultProps = {
    mapzenAccount: false,
};

function mapStateToProps(state) {
    return {
        mapzenAccount: state.user.admin || false,
    };
}

export default connect(mapStateToProps)(MenuBar);
