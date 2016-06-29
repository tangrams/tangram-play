
import React from 'react'
import ReactCSS, {Component} from 'reactcss'
import shallowCompare from 'react-addons-shallow-compare'

export default class SketchPresetColors extends React.Component {
    constructor (props) {
        super(props);
    }

  shouldComponentUpdate () {
      return shallowCompare.bind(this, this, arguments[0], arguments[1]);
  }

  styles() {
    return this.css({
      'no-presets': !this.props.colors || !this.props.colors.length,
    })
  }

  handleClick (hex) {
    this.props.onClick({
      hex: hex,
      source: 'hex',
    })
  }

  render() {
    var colors = []
    if (this.props.colors) {
      for (var i = 0; i < this.props.colors.length; i++) {
        var color = this.props.colors[i]
        colors.push(<div key={ color } is="li" ref={ color } onClick={ this.handleClick.bind(null, color) }><div style={{ background: color }} > <div is="square" /> </div></div>)
      }
    }

    return (
      <div is="colors">
        { colors }
      </div>
    )
  }
}
