import React from 'react';
import Button from 'react-bootstrap/lib/Button';

import EventEmitter from '../components/event-emitter';

export default class SignInOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    };

    this.onClickReturn = this.onClickReturn.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  componentDidMount() {
    EventEmitter.subscribe('sign_in:on', () => {
      this.show();
    });

    EventEmitter.subscribe('sign_in:off', () => {
      this.hide();
    });
  }

  onClickReturn(event) {
    EventEmitter.dispatch('mapzen:sign_in', {});
    this.hide();
  }

  show() {
    this.setState({ visible: true });
  }

  hide() {
    this.setState({ visible: false });
  }

  render() {
    const displayStyle = this.state.visible ?
      { display: 'flex' } :
      { display: 'none' };

    return (
      <div className="shield sign-in-overlay" style={displayStyle}>
        <div className="sign-in-overlay-title">Waiting for you to sign in...</div>
        <Button onClick={this.onClickReturn}>
          Go back to Tangram Play
        </Button>
      </div>
    );
  }
}

// Externally called to turn this on.
export function showSignInOverlay() {
  EventEmitter.dispatch('sign_in:on', {});
}

export function hideSignInOverlay() {
  EventEmitter.dispatch('sign_in:off', {});
}
