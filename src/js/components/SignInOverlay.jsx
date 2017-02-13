import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';

import store from '../store';
import { SHOW_SIGN_IN_OVERLAY, HIDE_SIGN_IN_OVERLAY } from '../store/actions';
import EventEmitter from '../components/event-emitter';

// Externally called to turn this on.
export function showSignInOverlay() {
  store.dispatch({ type: SHOW_SIGN_IN_OVERLAY });
}

export function hideSignInOverlay() {
  store.dispatch({ type: HIDE_SIGN_IN_OVERLAY });
}

class SignInOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.onClickReturn = this.onClickReturn.bind(this);
  }

  componentWillReceiveProps(nextProps) {

  }

  onClickReturn(event) {
    EventEmitter.dispatch('mapzen:sign_in', {});
    hideSignInOverlay();
  }

  render() {
    if (this.props.visible) {
      return (
        <div className="shield sign-in-overlay">
          <div className="sign-in-overlay-title">Waiting for you to sign in...</div>
          <Button onClick={this.onClickReturn}>
            Go back to Tangram Play
          </Button>
        </div>
      );
    }

    return null;
  }
}

SignInOverlay.propTypes = {
  visible: React.PropTypes.bool,
};

SignInOverlay.defaultProps = {
  visible: false,
};

function mapStateToProps(state) {
  return {
    visible: state.app.signInOverlay,
  };
}

export default connect(mapStateToProps)(SignInOverlay);
