import React from 'react';
import Draggable from 'react-draggable';
import ModalDialog from 'react-bootstrap/lib/ModalDialog';

/**
 * Represents a draggable container for a modal
 * Important: attaches to a div with a class 'drag'
 */
export default class DraggableModal extends React.Component {
    render () {
        return <Draggable bounds='#draggable-container' defaultPosition={{x: this.props.x, y: this.props.y}} zIndex={1800} handle='.drag'><ModalDialog {...this.props} /></Draggable>;
    }
}

/**
 * Prop validation required by React
 */
DraggableModal.propTypes = {
    x: React.PropTypes.number,
    y: React.PropTypes.number
};
