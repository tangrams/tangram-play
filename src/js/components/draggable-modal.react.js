import React from 'react'
import Draggable from 'react-draggable';
import ModalDialog from 'react-bootstrap/lib/ModalDialog'

export default class DraggableModal extends React.Component {
	render() {
		return <Draggable  bounds="#draggable-container" zIndex={1800} handle="strong"><ModalDialog {...this.props} /></Draggable>
	}
}
