import React from 'react';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';
import { EventEmitter } from '../components/event-emitter';

export default class Modal extends React.Component {
    constructor (props) {
        super(props);

        this.storeRefs = this.storeRefs.bind(this);
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

    /**
     * Unmounts this component. Can be called by parent components using a ref.
     *
     * @public
     */
    unmount () {
        ReactDOM.unmountComponentAtNode(this.el.parentNode);
    }

    /**
     * Stores reference to this modal's DOM node locally, and sends to parent
     * component if a callback function is provided.
     */
    storeRefs (ref) {
        this.el = ref;
        this.props.setRef(ref);
    }

    /**
     * Function to handle when the escape key is pressed.
     * Should be the same function as if you pressed the Cancel button.
     * Events are passed to the function as the first parameter.
     */
    handleEscKey (event) {
        const key = event.keyCode || event.which;

        if (key === 27 && !this.props.disableEsc) {
            if (this.props.cancelFunction !== noop) {
                this.props.cancelFunction(event);
            }
            // Without a cancel function handler, just unmount
            else {
                this.unmount();
            }
        }
    }

    render () {
        let classNames = 'modal';

        if (this.props.className) {
            classNames = `${classNames} ${this.props.className}`;
        }

        return (
            <div className={classNames} ref={this.storeRefs}>
                {this.props.children}
            </div>
        );
    }
}

Modal.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    disableEsc: React.PropTypes.bool,
    cancelFunction: React.PropTypes.func,
    setRef: React.PropTypes.func,
};

Modal.defaultProps = {
    disableEsc: false,
    cancelFunction: noop,
    setRef: noop
};
