import React from 'react'
import ReactCSS from 'reactcss'

import Modal from 'react-bootstrap/lib/Modal';
import DraggableModal from './draggable-modal.react.js';
import SketchPicker from './widget-color-picker/sketch.react'

import { editor, setNodeValue } from '../editor/editor';
import ColorConverter from '../pickers/types/color-converter'

/**
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default class WidgetColorPicker extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            displayColorPicker: false,
            color: this.props.node.value.replace(/\'/g,'')
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);

        this.node = this.props.node;
        this.bookmark = this.props.bookmark;

        // console.log(this.state.color);
        // console.log(this.node);
        // console.log(this.bookmark);
    }

  handleClick ()  {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  }

  handleChange (color) {
    //   console.log("handling change:")
    //   console.log(color);
    this.setState({ color: color.rgb });
    let test = '[' + color.rgb.r/1000 + ', ' + color.rgb.g/1000 + ', ' + color.rgb.b/1000 + ']';
    // console.log("printing test");
    // console.log(color.rgb);
    // console.log(test);
    // let currentcolor = '\''+this.state.color+'\'';
    // console.log(currentcolor);

    // let test2 = ColorConverter.rgb2vec(this.state.color);
    // console.log(test2);
    this.setEditorValue(test);
  }

  /**
   *  Use this method within a module to communicate a value
   *  back to the Tangram Play editor.
   */
  setEditorValue (string) {
    //   this.updateNodeReference(); //Why do we have to do this?

    console.log(this.bookmark);
    this.bookmark.widget.node.value = string;

    //   Send the value to editor
    //   console.log("NODE REACT HAS Before setting value:");
    //   console.log(this.node);
        // this.node.value = string;
    //   console.log("NODE REACT HAS:");
    //   console.log(this.node);
    console.log("setting node value: " + string);
    setNodeValue(this.node, string, '+value_change');

      // Change the value attached to this widget instance
    //   this.node.value = string;
  }

  render() {
      let widgetStyle = {
          backgroundColor: this.state.color
        };

    return (
      <div>
        <div className="widget widget-colorpicker" onClick={ this.handleClick } style={widgetStyle}>
        </div>
        <Modal id='modal-test' dialogComponentClass={DraggableModal} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker} onHide={this.handleClick}>
            <strong id='color-picker' className="cursor"><div>Drag here</div></strong>
          <SketchPicker className={'widget-color-picker'} color={ this.state.color } onChange={ this.handleChange }/>
        </Modal>

      </div>
    )
  }
}
