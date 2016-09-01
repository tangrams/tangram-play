import React from 'react';

import { EventEmitter } from '../components/event-emitter';

export default class SignInOverlay extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            visible: false
        };
    }

    componentDidMount () {
        EventEmitter.subscribe('sign_in:on', () => {
            this.setState({ visible: true });
        });

        EventEmitter.subscribe('sign_in:off', () => {
            this.setState({ visible: false });
        });
    }

    render () {
        const displayStyle = this.state.visible
            ? { display: 'flex' }
            : { display: 'none' };

        return (
            <div className="shield sign-in-overlay" style={displayStyle}>
                <h1>waiting for sign in</h1>
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
