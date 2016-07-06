// Class essentially taken from 'react-color': https://github.com/casesandberg/react-color/blob/master/src/components/sketched/Sketch.js

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { CustomPicker } from 'react-color';
import { Hue, Alpha, Saturation } from 'react-color/lib/components/common';
import ColorPickerInputFields from './color-picker-input-fields.react';

class ColorPickerBox extends React.Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    handleChange (data) {
        this.props.onChange(data);
    }

    render () {
        return (
            <div className='picker'>
                <div className='saturation'>
                    <Saturation className='saturation2' {...this.props} onChange={ this.handleChange }/>
                </div>
                <div className='controls flexbox-fix'>
                    <div className='sliders'>
                        <div className='hue'>
                            <Hue className='hue2' {...this.props} onChange={ this.handleChange } />
                        </div>
                        <div className='alpha'>
                            <Alpha className='alpha2' {...this.props} onChange={ this.handleChange } />
                        </div>
                    </div>
                    <div className='color'>
                        <div className='activeColor' style={{ backgroundColor: 'rgba(' + this.props.rgb.r + ', ' + this.props.rgb.g + ', ' + this.props.rgb.b + ', ' + this.props.rgb.a + ')' }}/>
                    </div>
                </div>
                <div className='fields'>
                    <ColorPickerInputFields {...this.props} onChange={ this.handleChange } />
                </div>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
ColorPickerBox.propTypes = {
    rgb: React.PropTypes.object,
    onChange: React.PropTypes.func
};

export default CustomPicker(ColorPickerBox);
