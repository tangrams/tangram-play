import localforage from 'localforage';
import React from 'react';
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
import { showConfirmDialogModal } from '../modals/ConfirmDialogModal';
import { showErrorModal } from '../modals/ErrorModal';
import { setGlobalIntrospection } from '../map/inspection';
import { requestUserSignInState } from '../user/sign-in';
import { openSignInWindow } from '../user/sign-in-window';
import SignInButton from './SignInButton';

// Redux
import store from '../store';
import { SHOW_MODAL } from '../store/actions';

function showModal(type, priority = 0) {
  store.dispatch({
    type: SHOW_MODAL,
    modalType: type,
    priority,
  });
}

function clickNew() {
  newScene();
}

function clickOpenFile() {
  openLocalFile();
}

function clickOpenGist() {
  checkSaveStateThen(() => {
    showModal('OPEN_GIST');
  });
}

function clickOpenURL() {
  checkSaveStateThen(() => {
    showModal('OPEN_URL');
  });
}

function clickOpenExample() {
  checkSaveStateThen(() => {
    showModal('OPEN_EXAMPLE');
  });
}

function clickSaveFile() {
  exportSceneFile();
}

function onClickShare() {
  showErrorModal('We’re working on it!');
}

function unsubscribeSaveAsToCloud() {
  // eslint-disable-next-line no-use-before-define
  EventEmitter.unsubscribe('mapzen:sign_in', clickSaveAsToCloud);
}

function showSaveAsToCloudModal() {
  unsubscribeSaveAsToCloud();
  showModal('SAVE_TO_CLOUD');
}

function clickSaveAsToCloud() {
  requestUserSignInState()
    .then((data) => {
      if (!data) {
        showErrorModal('ERROR 12A: Unable to sign you in since you’re not hosted on Mapzen.');
        return;
      }

      if (data.id) {
        showSaveAsToCloudModal();
      } else if (data.authDisabled) {
        showErrorModal('You must be signed in to use this feature, but signing in is unavailable on the HTTP protocol. Please switch to the more-secure HTTPS protocol to sign in to Mapzen.');
      } else {
        const message = 'You are not signed in! Please sign in now.';
        showConfirmDialogModal(message, openSignInWindow, unsubscribeSaveAsToCloud);
        EventEmitter.subscribe('mapzen:sign_in', clickSaveAsToCloud);
      }
    });
}

/**
 * Check whether the scene is already saved to Mapzen and if so, confirm overwrite.
 * Otherwise, use the Save As function.
 */
function unsubscribeSaveToCloud() {
  // eslint-disable-next-line no-use-before-define
  EventEmitter.unsubscribe('mapzen:sign_in', clickSaveAsToCloud);
}

function showConfirmSaveOverModal() {
  unsubscribeSaveToCloud();
  showModal('SAVE_EXISTING_TO_CLOUD');
}

function clickSaveToCloud() {
  const scene = store.getState().scene;
  if (scene.saved && scene.saveLocation === 'MAPZEN' && scene.mapzenSceneData.id) {
    // Duplicating some functionality from clickSaveAsToCloud()
    // todo refactor
    requestUserSignInState()
      .then((data) => {
        if (!data) {
          showErrorModal('ERROR 12A: Unable to sign you in since you’re not hosted on Mapzen.');
          return;
        }

        if (data.id) {
          // TODO: Check scene belongs to user
          showConfirmSaveOverModal();
        } else if (data.authDisabled) {
          showErrorModal('You must be signed in to use this feature, but signing in is unavailable on the HTTP protocol. Please switch to the more-secure HTTPS protocol to sign in to Mapzen.');
        } else {
          const message = 'You are not signed in! Please sign in now.';
          showConfirmDialogModal(message, openSignInWindow, unsubscribeSaveToCloud);
          EventEmitter.subscribe('mapzen:sign_in', clickSaveToCloud);
        }
      });
  } else {
    clickSaveAsToCloud();
  }
}

function unsubscribeOpenFromCloud() {
  // eslint-disable-next-line no-use-before-define
  EventEmitter.unsubscribe('mapzen:sign_in', clickOpenFromCloud);
}

function showOpenFromCloudModal() {
  unsubscribeOpenFromCloud();
  checkSaveStateThen(() => {
    showModal('OPEN_FROM_CLOUD');
  });
}

function clickOpenFromCloud() {
  requestUserSignInState()
    .then((data) => {
      if (!data) {
        showErrorModal('ERROR 12B: Unable to sign you in since you’re not hosted on Mapzen.');
        return;
      }

      if (data.id) {
        showOpenFromCloudModal();
      } else if (data.authDisabled) {
        showErrorModal('You must be signed in to use this feature, but signing in is unavailable on the HTTP protocol. Please switch to the more-secure HTTPS protocol to sign in to Mapzen.');
      } else {
        const message = 'You are not signed in! Please sign in now.';
        showConfirmDialogModal(message, openSignInWindow, unsubscribeOpenFromCloud);
        EventEmitter.subscribe('mapzen:sign_in', clickOpenFromCloud);
      }
    });
}

function clickAbout() {
  showModal('ABOUT');
}

function clickWhatsNew() {
  showModal('WHATS_NEW');
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

    this.onClickInspect = this.onClickInspect.bind(this);
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

  onClickInspect() {
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
    let signInRequiredMsg = null;
    if (this.props.userSignedIn === false) {
      signInRequiredMsg = <div className="menu-item-note">Sign-in required</div>;
    }

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
              <NavDropdown
                title={<span><Icon type="bt-file" />New</span>}
                id="new-dropdown"
              >
                <MenuItem onClick={clickNew}>
                  <Icon type="bt-file" />New blank scene
                </MenuItem>
                <MenuItem onClick={clickOpenExample}>
                  <Icon type="bt-map" />New scene from example…
                </MenuItem>
              </NavDropdown>
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
                  <Icon type="bt-folder" />Open a file…
                </MenuItem>
                {(() => {
                  if (this.props.isMapzenHosted) {
                    return (
                      <MenuItem onClick={clickOpenFromCloud}>
                        <Icon type="bt-cloud-download" />Open…
                        {signInRequiredMsg}
                      </MenuItem>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  if (this.state.legacyGistMenu) {
                    return (
                      <MenuItem onClick={clickOpenGist}>
                        <Icon type="bt-code" />Open a saved Gist (Legacy)
                      </MenuItem>
                    );
                  }
                  return null;
                })()}
                <MenuItem onClick={clickOpenURL}>
                  <Icon type="bt-link" />Open from URL…
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
                  <Icon type="bt-download" />Download
                </MenuItem>
                {(() => {
                  if (this.props.isMapzenHosted) {
                    return (
                      <MenuItem onClick={clickSaveToCloud}>
                        <Icon type="bt-cloud-upload" />Save
                        {signInRequiredMsg}
                      </MenuItem>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  if (this.props.isMapzenHosted) {
                    return (
                      <MenuItem onClick={clickSaveAsToCloud}>
                        <Icon type="bt-cloud-upload" />Save as…
                        {signInRequiredMsg}
                      </MenuItem>
                    );
                  }
                  return null;
                })()}
              </NavDropdown>
            </OverlayTrigger>

            {/* Share button */}
            <OverlayTrigger
              rootClose
              placement="bottom"
              overlay={<Tooltip id="tooltip">Share your scene</Tooltip>}
              delayShow={200}
            >
              <NavDropdown
                title={<span><Icon type="bt-external-link" />Share</span>}
                id="share-dropdown"
              >
                <MenuItem onClick={onClickShare}>
                  <Icon type="bt-link" />View hosted link
                </MenuItem>
                <MenuItem onClick={onClickShare}>
                  <Icon type="bt-code" />Get embed code…
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
                eventKey="inspect"
                onClick={this.onClickInspect}
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
                <MenuItem onClick={clickWhatsNew}>
                  <Icon type="bt-gift" />What’s new?
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
  isMapzenHosted: React.PropTypes.bool,
  userSignedIn: React.PropTypes.bool.isRequired,
};

MenuBar.defaultProps = {
  isMapzenHosted: false,
};

function mapStateToProps(state) {
  return {
    isMapzenHosted: state.system.mapzen || state.system.localhost,
    userSignedIn: state.user.signedIn,
  };
}

export default connect(mapStateToProps)(MenuBar);
