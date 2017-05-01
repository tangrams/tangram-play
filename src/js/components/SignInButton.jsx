import React from 'react';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import UserAvatar from './UserAvatar';

import EventEmitter from './event-emitter';
import { showErrorModal } from '../modals/ErrorModal';
import { requestUserSignInState, requestUserSignOut } from '../user/sign-in';
import { openSignInWindow } from '../user/sign-in-window';
import { checkSaveStateThen } from '../editor/io';

// This is not exported. It will be connected to a Redux container component
// which _is_ exported.
class SignInButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      serverContacted: false,
      authDisabled: this.props.system.mapzen && !this.props.system.ssl,
    };

    this.onClickSignIn = this.onClickSignIn.bind(this);
    this.onClickSignOut = this.onClickSignOut.bind(this);
    this.checkLoggedInState = this.checkLoggedInState.bind(this);
  }

  componentDidMount() {
    this.checkLoggedInState();

    EventEmitter.subscribe('mapzen:sign_in', this.checkLoggedInState);
  }

  onClickSignIn(event) {
    if (this.state.authDisabled === true) {
      showErrorModal('Sign in is unavailable on the HTTP protocol. Please switch to the more-secure HTTPS protocol to sign in to Mapzen.');
    } else {
      openSignInWindow();
    }
  }

  /**
   * Signs out of mapzen.com. Check state of editor first to make sure that
   * the user is ready to navigate away.
   */
  // eslint-disable-next-line class-methods-use-this
  onClickSignOut(event) {
    checkSaveStateThen(() => {
      requestUserSignOut()
        .catch((error) => {
          showErrorModal('Unable to sign you out.');
        });
    });
  }

  checkLoggedInState() {
    requestUserSignInState().then((data) => {
      // This tells us we've contacted mapzen.com and the API is valid
      // `data` is null if we are not hosted in the right place
      if (data) {
        this.setState({
          serverContacted: true,
        });
      }
    });
  }

  // Note on wording:
  //   >  You "sign in" or "sign off" when accessing an account.
  //   >  You "log on" or "log out" of a operating system session.
  // https://github.com/mapzen/styleguide/blob/master/src/site/guides/common-terms-and-conventions.md
  render() {
    const user = this.props.user;

    if (user.signedIn) {
      const ButtonContents = <UserAvatar user={user} />;

      let tooltipContents = 'This is you!';
      if (user.admin === true) {
        tooltipContents = '★ You are an admin.';
      }

      return (
        <OverlayTrigger
          rootClose
          placement="bottom"
          overlay={<Tooltip id="tooltip">{tooltipContents}</Tooltip>}
          delayShow={200}
        >
          <NavDropdown
            title={ButtonContents}
            className="menu-sign-in"
            id="sign-in"
          >
            <MenuItem onClick={this.onClickSignOut}>
              <Icon type="bt-sign-out" /> Sign out
            </MenuItem>
          </NavDropdown>
        </OverlayTrigger>
      );
    } else if ((this.state.serverContacted && !user.signedIn) || this.state.authDisabled) {
      // Logged out state. Only display if server is contacted and has confirmed
      // no user is logged in. This is to prevent this button from having a
      // "Sign in" momentarily flash before the sign-in-state API is contacted.
      // Also display if auth is disabled on non-SSL Mapzen host.
      let classNames = 'menu-sign-in';
      if (this.state.authDisabled) {
        classNames += ' menu-sign-in-disabled';
      }

      let tooltipContents = 'Sign in with your Mapzen account';
      if (this.state.authDisabled === true) {
        tooltipContents = 'Sign in is currently unavailable';
      }

      return (
        <OverlayTrigger
          rootClose
          placement="bottom"
          overlay={<Tooltip id="tooltip">{tooltipContents}</Tooltip>}
          delayShow={200}
        >
          <NavItem onClick={this.onClickSignIn} href="#" className={classNames}>
            Sign in <Icon type="bt-sign-in" />
          </NavItem>
        </OverlayTrigger>
      );
    }

    return null;
  }
}

SignInButton.propTypes = {
  user: React.PropTypes.shape({
    signedIn: React.PropTypes.bool.isRequired,
    nickname: React.PropTypes.string,
    email: React.PropTypes.string,
    avatar: React.PropTypes.string,
    admin: React.PropTypes.bool,
  }),
  system: React.PropTypes.shape({
    mapzen: React.PropTypes.bool,
    ssl: React.PropTypes.bool,
  }).isRequired,
};

SignInButton.defaultProps = {
  user: {
    signedIn: false,
    admin: false,
  },
};

function mapStateToProps(state) {
  return {
    user: state.user,
    system: state.system,
  };
}

export default connect(mapStateToProps)(SignInButton);
