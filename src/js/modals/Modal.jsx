import _ from 'lodash';
import React from 'react';
import { EventEmitter } from '../components/event-emitter';

export default class Modal extends React.Component {
    constructor (props) {
        super(props);

        this.handleEscKey = this.handleEscKey.bind(this);
    }

    componentDidMount () {
        // Control visibility state of the Shield
        // TODO: Control this without using the EventEmitter
        EventEmitter.dispatch('modal:on', {});

        // Add the listener for the escape key
        window.addEventListener('keydown', this.handleEscKey, false);
    }

    componentWillUnmount () {
        EventEmitter.dispatch('modal:off', {});
        window.removeEventListener('keydown', this.handleEscKey, false);
    }

    // Function to handle when the escape key is pressed.
    // Should be the same function as if you pressed the Cancel button.
    // Events are passed to the function as the first parameter.
    handleEscKey (event) {
        const key = event.keyCode || event.which;

        if (key === 27 && !this.props.disableEsc) {
            this.props.cancelFunction(event);
        }
    }

    render () {
        let classNames = 'modal';

        if (this.props.className) {
            classNames = `${classNames} ${this.props.className}`;
        }

        return (
            <div className={classNames}>
                {this.props.children}
            </div>
        );
    }
}

Modal.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    disableEsc: React.PropTypes.bool,
    cancelFunction: React.PropTypes.func
};

Modal.defaultProps = {
    disableEsc: false,
    cancelFunction: _.noop
};
