import React from 'react';

// Required event dispatch and subscription for now while
// parts of app are React components and others are not
import EventEmitter from '../components/event-emitter';

export default class Shield extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: false,
        };
    }

    componentDidMount() {
        // When a Modal component fires "on", shield turns itself on.
        EventEmitter.subscribe('modal:on', () => {
            this.setState({ visible: true });
        });

        // When a Modal component fires "off", shield turns itself off.
        EventEmitter.subscribe('modal:off', () => {
            this.setState({ visible: false });
        });
    }

    render() {
        const displayStyle = this.state.visible
            ? { display: 'block' }
            : { display: 'none' };

        return <div className="shield" style={displayStyle} />;
    }
}

// Legacy shield functions.

export function showShield() {
    EventEmitter.dispatch('modal:on', {});
}

export function hideShield() {
    EventEmitter.dispatch('modal:off', {});
}
