import localforage from 'localforage';
import React from 'react';
import { connect } from 'react-redux';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import EventEmitter from './event-emitter';
import { trackGAEvent } from '../tools/analytics';

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

function checkUserAuthAvailability() {
  const system = store.getState().system;

  if (!system.mapzen) {
    showErrorModal('Unable to sign you in since you’re not hosted on Mapzen.');
    return false;
  }
  if (system.mapzen && !system.ssl) {
    showErrorModal('You must be signed in to use this feature, but signing in is unavailable on the HTTP protocol. Please switch to the more-secure HTTPS protocol to sign in to Mapzen.');
    return false;
  }

  return true;
}

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

function clearSignInCallbackMethod() {
  store.dispatch({
    type: 'SET_SIGN_IN_CALLBACK_METHOD',
    method: null,
  });
}

function clickSaveAsToCloud() {
  if (checkUserAuthAvailability() === false) return;

  clearSignInCallbackMethod();
  requestUserSignInState()
    .then((data) => {
      if (!data) {
        showErrorModal('ERROR 12B: Unable to sign you in. The authentication service could not be reached.');
        return;
      }

      if (data.id) {
        showModal('SAVE_TO_CLOUD');
      } else {
        const message = 'You are not signed in! Please sign in now.';
        showConfirmDialogModal(message, openSignInWindow, clearSignInCallbackMethod);
        store.dispatch({
          type: 'SET_SIGN_IN_CALLBACK_METHOD',
          method: 'SAVE_TO_CLOUD',
        });
      }
    });
}

/**
 * Check whether the scene is already saved to Mapzen and if so, confirm overwrite.
 * Otherwise, use the Save As function.
 */
function clickSaveToCloud() {
  const scene = store.getState().scene;
  if (scene.mapzenSceneData && scene.mapzenSceneData.id) {
    // Duplicating some functionality from clickSaveAsToCloud()
    // todo refactor
    if (checkUserAuthAvailability() === false) return;

    clearSignInCallbackMethod();
    requestUserSignInState()
      .then((data) => {
        if (!data) {
          showErrorModal('ERROR 12B: Unable to sign you in. The authentication service could not be reached.');
          return;
        }

        if (data.id) {
          // TODO: Check scene belongs to user
          showModal('SAVE_EXISTING_TO_CLOUD');
        } else {
          const message = 'You are not signed in! Please sign in now.';
          showConfirmDialogModal(message, openSignInWindow, clearSignInCallbackMethod);
          store.dispatch({
            type: 'SET_SIGN_IN_CALLBACK_METHOD',
            method: 'SAVE_EXISTING_TO_CLOUD',
          });
        }
      });
  } else {
    clickSaveAsToCloud();
  }
}

function clickOpenFromCloud() {
  if (checkUserAuthAvailability() === false) return;

  clearSignInCallbackMethod();
  requestUserSignInState()
    .then((data) => {
      if (!data) {
        showErrorModal('ERROR 12B: Unable to sign you in. The authentication service could not be reached.');
        return;
      }

      if (data.id) {
        checkSaveStateThen(() => {
          showModal('OPEN_FROM_CLOUD');
        });
      } else {
        const message = 'You are not signed in! Please sign in now.';
        showConfirmDialogModal(message, openSignInWindow, clearSignInCallbackMethod);
        store.dispatch({
          type: 'SET_SIGN_IN_CALLBACK_METHOD',
          method: 'OPEN_FROM_CLOUD',
        });
      }
    });
}

function doSignInCallbackMethod() {
  const method = store.getState().app.signInCallbackMethod;

  switch (method) {
    case 'SAVE_TO_CLOUD':
      clickSaveAsToCloud();
      break;
    case 'SAVE_EXISTING_TO_CLOUD':
      clickSaveToCloud();
      break;
    case 'OPEN_FROM_CLOUD':
      clickOpenFromCloud();
      break;
    default:
      break;
  }
}

function onClickShare() {
  const scene = store.getState().scene;
  if (scene.mapzenSceneData && scene.mapzenSceneData.id) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'SHARE_HOSTED_MAP',
    });
  } else {
    showConfirmDialogModal('You can share a map hosted on Mapzen if you save your scene to your Mapzen account. Do you want to do this now?', () => {
      clickSaveToCloud();
    });
  }
}

function onClickEmbed() {
  store.dispatch({
    type: SHOW_MODAL,
    modalType: 'SHOW_CODE_SNIPPET',
  });
}

function clickAbout() {
  showModal('ABOUT');
}

function clickWhatsNew() {
  trackGAEvent('MenuBar', 'click', 'What’s New');
  showModal('WHATS_NEW');
}

function clickSupport() {
  showModal('SUPPORT');
}

const getStartedLink = './docs';
const documentationLink = 'https://mapzen.com/documentation/tangram/';
// const tutorialLink = 'https://tangrams.github.io/tangram-tutorial/';

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

  componentDidMount() {
    EventEmitter.subscribe('mapzen:sign_in', doSignInCallbackMethod);
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
    if (this.props.system.mapzen) {
      if (!this.props.system.ssl) {
        signInRequiredMsg = <div className="menu-item-note">Sign-in unavailable</div>;
      } else if (this.props.userSignedIn === false) {
        signInRequiredMsg = <div className="menu-item-note">Sign-in required</div>;
      }
    }

    return (
      <Navbar inverse className="menu-bar">
        {/* The brand section */}
        <Navbar.Header>
          <Navbar.Brand>
            <span className="brand">
              Tangram Work (BETA)
            </span>
          </Navbar.Brand>
        </Navbar.Header>

        <Navbar>
          {/* Left menu section */}
          <Nav pullLeft>
            {/* New button*/}
            <NavDropdown
              title={<span><span className="menu-item-underline">N</span>ew</span>}
              id="new-dropdown"
            >
              <MenuItem onClick={clickNew}>
                New blank scene
              </MenuItem>
              <MenuItem onClick={clickOpenExample}>
                New from example…
              </MenuItem>
            </NavDropdown>

            {/* Open dropdown */}

            <NavDropdown
              title={<span><span className="menu-item-underline">O</span>pen</span>}
              id="open-dropdown"
            >
              <MenuItem onClick={clickOpenFile}>
                Open scene…
              </MenuItem>
              {(() => {
                if (this.props.isMapzenHosted) {
                  return (
                    <MenuItem onClick={clickOpenFromCloud}>
                      Open scene from Mapzen account…
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
                      Open scene from GitHub Gist (Legacy)…
                    </MenuItem>
                  );
                }
                return null;
              })()}
              <MenuItem onClick={clickOpenURL}>
                Open from URL…
              </MenuItem>
            </NavDropdown>

            {/* Save dropdown */}
            <NavDropdown
              title={<span><span className="menu-item-underline">S</span>ave</span>}
              id="save-dropdown"
            >
              <MenuItem onClick={clickSaveFile}>
                Download
              </MenuItem>
              {(() => {
                if (this.props.isMapzenHosted) {
                  return (
                    <MenuItem onClick={clickSaveToCloud}>
                      Save to Mapzen account…
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
                      Save as…
                      {signInRequiredMsg}
                    </MenuItem>
                  );
                }
                return null;
              })()}
            </NavDropdown>

            {/* Share button */}
            <NavDropdown
              title={<span>Sh<span className="menu-item-underline">a</span>re</span>}
              id="share-dropdown"
            >
              {(() => {
                if (this.props.isMapzenHosted) {
                  return (
                    <MenuItem onClick={onClickShare}>
                      Get sharable link to your map…
                    </MenuItem>
                  );
                }
                return null;
              })()}
              <MenuItem onClick={onClickEmbed}>
                Get code snippet…
              </MenuItem>
            </NavDropdown>

            {/* Introspection button */}
            <NavItem
              eventKey="inspect"
              onClick={this.onClickInspect}
              active={this.state.inspectActive}
            >
              <span className="menu-item-underline">I</span>nspect
            </NavItem>

            {/* Fullscreen button */}
            <MenuFullscreen />

            {/* Help dropdown */}
            <NavDropdown
              title={<span><span className="menu-item-underline">H</span>elp</span>}
              id="help-dropdown"
            >
              <MenuItem onClick={clickAbout}>
                About
              </MenuItem>
              <MenuItem onClick={clickWhatsNew}>
                What’s new?
              </MenuItem>
              <MenuItem href={getStartedLink} target="_blank" rel="noopener noreferrer">
                Get started
              </MenuItem>
              <MenuItem href={documentationLink} target="_blank" rel="noopener noreferrer">
                Tangram documentation
              </MenuItem>
              {/* // TEMP: hidden.
                <MenuItem href={tutorialLink} target="_blank" rel="noopener noreferrer">
                  <Icon type="bt-notebook" />Tutorial
                </MenuItem>
              */}
              <MenuItem onClick={clickSupport}>
                Support
              </MenuItem>
            </NavDropdown>

            {/* Sign in */}
            <SignInButton />
          </Nav>
        </Navbar>
      </Navbar>
    );
  }
}

MenuBar.propTypes = {
  isMapzenHosted: React.PropTypes.bool,
  userSignedIn: React.PropTypes.bool.isRequired,
  system: React.PropTypes.shape({
    mapzen: React.PropTypes.bool,
    ssl: React.PropTypes.bool,
  }).isRequired,
};

MenuBar.defaultProps = {
  isMapzenHosted: false,
};

function mapStateToProps(state) {
  return {
    isMapzenHosted: state.system.mapzen,
    userSignedIn: state.user.signedIn,
    system: state.system,
  };
}

export default connect(mapStateToProps)(MenuBar);
