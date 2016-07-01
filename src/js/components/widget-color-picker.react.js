import React from 'react'
import ReactCSS from 'reactcss'

import Modal from 'react-bootstrap/lib/Modal';
import DraggableModal from './draggable-modal.react.js';
import SketchPicker from './widget-color-picker/sketch.react'

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

  handleClick ()  {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  }

  handleChange (color) {
    this.setState({ color: color.rgb })
  }

  render() {
    return (
      <div>
        <div className="widget widget-colorpicker" onClick={ this.handleClick }>
        </div>
        <Modal id='modal-test' dialogComponentClass={DraggableModal} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker} onHide={this.handleClick}>
            <strong id='color-picker' className="cursor"><div>Drag here</div></strong>
          <SketchPicker className={'widget-color-picker'} color={ this.state.color } onChange={ this.handleChange }/>
        </Modal>

      </div>
    )
  }
}

//<ReactColorPreset className={'widget-color-picker'} color={ this.state.color } onChange={ this.handleChange } />
//this.state.displayColorPicker
//onHide={this.close} onClick={ this.handleClose }

//<SketchPicker custom={ SketchPicker } className={'widget-color-picker'} rgb={this.state.color} color={ this.state.color } onChange={ this.handleChange } />
