import React from 'react'
import ReactCSS from 'reactcss'
//import { SketchPicker } from 'react-color'
import { SketchPicker } from './sketch.react'
import Modal from 'react-bootstrap/lib/Modal';
import Draggable from 'react-draggable'; // The default
import ModalDialog from 'react-bootstrap/lib/ModalDialog'

class DraggableModalDialog extends React.Component {
	render() {
		return <Draggable  bounds="#draggable-container" zIndex={1800} handle="strong"><ModalDialog {...this.props} /></Draggable>
	}
}

/**
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default class WidgetColorPicker extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            displayColorPicker: false,
            color: {
              r: '241',
              g: '112',
              b: '19',
              a: '1',
            },
            hsl: {
                h: 0,
                s: 0,
                l: .20,
                a: 1,
            }
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

  handleClick ()  {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  }

  handleClose () {
    this.setState({ displayColorPicker: false })
  }

  handleChange (color) {
    this.setState({ color: color.rgb })
  }

  render() {
      console.log(this.state.displayColorPicker);
    return (
      <div>
        <div className="widget widget-colorpicker" onClick={ this.handleClick }>
        </div>
        <Modal id='modal-test' dialogComponentClass={DraggableModalDialog} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker}>
            <strong id='color-picker' className="cursor"><div>Drag here</div></strong>
          <SketchPicker className={'widget-color-picker'} color={ this.state.color } onChange={ this.handleChange } />
        </Modal>

      </div>
    )
  }
}

//this.state.displayColorPicker
//onHide={this.close} onClick={ this.handleClose }
