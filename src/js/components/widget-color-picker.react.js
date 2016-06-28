import React from 'react'
import ReactCSS from 'reactcss'
import { SketchPicker } from 'react-color'
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
            }
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

  classes() {
    return {
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
          boxSizing: 'border-box',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          maxWidth: '14px',
          maxHeight:'14px',
          width: '1em',
          height: '1em',
          backgroundColor: 'white',
          cursor: 'pointer',
          verticalAlign: 'middle',
          marginTop: '-0.15em',
          display: 'inline-block',
          position: 'relative',
          userSelect: 'none',
          marginLeft: '6px',
          marginRight: '6px',
          marginTop: '0',
          marginBottom: '0',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      },
    }
  }

  componentDidMount() {

  }

  handleClick ()  {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
    let d = document.getElementById('#modal-test');
    console.log(d);

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
          <SketchPicker className='widget-color-picker' color={ this.state.color } onChange={ this.handleChange } />
        </Modal>

      </div>
    )
  }
}

//this.state.displayColorPicker
//onHide={this.close} onClick={ this.handleClose }
