import React from 'react';

import { EventEmitter } from '../components/event-emitter';

export default class SignInOverlay extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            visible: false
        };

        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
    }

    componentDidMount () {
        EventEmitter.subscribe('sign_in:on', () => {
            this.show();
        });

        EventEmitter.subscribe('sign_in:off', () => {
            this.hide();
        });
    }

    show () {
        this.setState({ visible: true });
    }

    hide () {
        window.setTimeout(() => {
            this.setState({ visible: false });
        }, 1600);
    }

    render () {
        const displayStyle = this.state.visible
            ? { display: 'flex' }
            : { display: 'none' };

        return (
            <div className="shield sign-in-overlay" style={displayStyle}>
                <div className="sign-in-overlay-title">Waiting for you to sign in...</div>
            </div>
        );
    }
}

// Externally called to turn this on.
export function showSignInOverlay () {
    EventEmitter.dispatch('sign_in:on', {});
}

export function hideSignInOverlay () {
    EventEmitter.dispatch('sign_in:off', {});
}
