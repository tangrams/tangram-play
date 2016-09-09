import React from 'react';
import Draggable from 'react-draggable';
import ModalDialog from 'react-bootstrap/lib/ModalDialog';

/**
 * Represents a draggable container for a modal
 * Important: attaches to a div with a class 'drag'
 *
 * This is a workaround for Draggable not working directly with react-bootstrap
 * Modal components. See here. https://github.com/mzabriskie/react-draggable/issues/56
 */
export default class DraggableModal extends React.PureComponent {
    render() {
        return (
            <Draggable
                bounds="#draggable-container"
                defaultPosition={{ x: this.props.x, y: this.props.y }}
                zIndex={1800}
                handle=".floating-panel-drag"
            >
                <ModalDialog {...this.props} />
            </Draggable>
        );
    }
}

/**
 * Prop validation required by React
 */
DraggableModal.propTypes = {
    x: React.PropTypes.number,
    y: React.PropTypes.number,
};
