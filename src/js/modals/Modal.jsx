import React from 'react';
import { EventEmitter } from '../components/event-emitter';

export default class Modal extends React.Component {
    componentDidMount () {
        // Control visibility state of the Shield
        // TODO: Control this without using the EventEmitter
        EventEmitter.dispatch('modal:on', {});
    }

    componentWillUnmount () {
        EventEmitter.dispatch('modal:off', {});
    }

    render () {
        let classNames = 'modal';

        if (this.props.className !== '') {
            classNames = `${classNames} ${this.props.className}`;
        }

        return (
            <div className={classNames} style={{display: 'block'}}>
                {this.props.children}
            </div>
        );
    }
}

Modal.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
};
