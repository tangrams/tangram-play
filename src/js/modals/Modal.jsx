import React from 'react';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';
import store from '../store';
import { SET_SHIELD_VISIBILITY } from '../store/actions';

export default class Modal extends React.Component {
    constructor(props) {
        super(props);

        this.storeRefs = this.storeRefs.bind(this);
        this.handleEscKey = this.handleEscKey.bind(this);
    }

    componentDidMount() {
        // Control visibility state of the Shield
        store.dispatch({
            type: SET_SHIELD_VISIBILITY,
            visible: true,
        });

        // Add the listener for the escape key
        window.addEventListener('keydown', this.handleEscKey, false);
    }

    componentWillUnmount() {
        store.dispatch({
            type: SET_SHIELD_VISIBILITY,
            visible: false,
        });

        window.removeEventListener('keydown', this.handleEscKey, false);
    }

    /**
     * Unmounts this component. Can be called by parent components using a ref.
     *
     * @public
     */
    unmount() {
        ReactDOM.unmountComponentAtNode(this.el.parentNode);
    }

    /**
     * Stores reference to this modal's DOM node locally, and sends to parent
     * component if a callback function is provided.
     */
    storeRefs(ref) {
        this.el = ref;
        this.props.setRef(ref);
    }

    /**
     * Function to handle when the escape key is pressed.
     * Should be the same function as if you pressed the Cancel button.
     * Events are passed to the function as the first parameter.
     */
    handleEscKey(event) {
        const key = event.keyCode || event.which;

        if (key === 27 && !this.props.disableEsc) {
            if (this.props.cancelFunction !== noop) {
                this.props.cancelFunction(event);
            } else {
                // Without a cancel function handler, just unmount
                this.unmount();
            }
        }
    }

    render() {
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
    setRef: noop,
};
