// Class essentially taken from 'react-color' https://github.com/casesandberg/react-color/blob/master/src/components/sketched/SketchFields.js

import React from 'react';
import { EditableInput } from 'react-color/lib/components/common';

export default class ColorPickerInputFields extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  /**
   * Handle changes in input fields.
   * Signature of the `data` object passed in uses EditableInput's `label`
   * prop as the property name. e.g. `label='r'` becomes `data.r`. Do not
   * change these labels! (Use CSS to style these elements if necessary.)
   */
  onChange(data) {
    const color = this.props.color.getRgba();

    if (data.hex) {
      this.props.onChange(data.hex);
    } else if (data.r || data.g || data.b || data.a) {
      let a = parseFloat(data.a);

      // Clamp a between 0-1 range
      a = Math.max(Math.min(a, 1), 0);

      if (a === 0) {
        this.props.onChange({
          r: data.r || color.r,
          g: data.g || color.g,
          b: data.b || color.b,
          a: 0.0,
        });
      } else {
        this.props.onChange({
          r: data.r || color.r,
          g: data.g || color.g,
          b: data.b || color.b,
          a: a || color.a,
        });
      }
    }
  }

  render() {
    const color = this.props.color.getRgba();
    const hex = this.props.color.getHexString();

    return (
      <div className="colorpicker-input-fields">
        <div className="colorpicker-input-double">
          <EditableInput label="hex" value={hex} onChange={this.onChange} />
        </div>
        <div className="colorpicker-input-single">
          <EditableInput label="r" value={color.r} onChange={this.onChange} />
        </div>
        <div className="colorpicker-input-single">
          <EditableInput label="g" value={color.g} onChange={this.onChange} />
        </div>
        <div className="colorpicker-input-single">
          <EditableInput label="b" value={color.b} onChange={this.onChange} />
        </div>
        <div className="colorpicker-input-alpha">
          <EditableInput label="a" value={color.a.toFixed(2)} onChange={this.onChange} />
        </div>
      </div>
    );
  }
}

ColorPickerInputFields.propTypes = {
  color: React.PropTypes.objectOf(React.PropTypes.any),
  onChange: React.PropTypes.func,
};
