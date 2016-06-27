import React from 'react'
import ReactCSS from 'reactcss'
import { SketchPicker } from 'react-color'

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

  handleClick ()  {
      console.log("clicking widget widget-colorpicker");
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  }

  handleClose () {
    this.setState({ displayColorPicker: false })
  }

  handleChange (color) {
    this.setState({ color: color.rgb })
  }

  render() {
    return (
      <div>
        <div className="widget widget-colorpicker" onClick={ this.handleClick }>
        </div>
      </div>
    )
  }
}
