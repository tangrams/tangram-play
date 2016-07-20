// Class essentially taken from 'react-color': https://github.com/casesandberg/react-color/blob/master/src/components/sketched/Sketch.js

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { CustomPicker } from 'react-color';
import { Hue, Alpha, Saturation } from 'react-color/lib/components/common';
import WidgetColorInputFields from './widget-color-input-fields.react';

class WidgetColorBox extends React.Component {
    constructor (props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    onChange (data) {
        this.props.onChange(data);
    }

    render () {
        return (
            <div className='widget-color-box'>
                <div className='saturation'>
                    <Saturation className='saturation2' {...this.props} onChange={ this.onChange }/>
                </div>
                <div className='controls flexbox-fix'>
                    <div className='sliders'>
                        <div className='hue'>
                            <Hue className='hue2' {...this.props} onChange={ this.onChange } />
                        </div>
                        <div className='alpha'>
                            <Alpha className='alpha2' {...this.props} onChange={ this.onChange } />
                        </div>
                    </div>
                    <div className='color'>
                        <div className='activeColor' style={{ backgroundColor: 'rgba(' + this.props.rgb.r + ', ' + this.props.rgb.g + ', ' + this.props.rgb.b + ', ' + this.props.rgb.a + ')' }}/>
                    </div>
                </div>
                <div className='fields'>
                    <WidgetColorInputFields {...this.props} onChange={ this.onChange } />
                </div>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetColorBox.propTypes = {
    rgb: React.PropTypes.object,
    onChange: React.PropTypes.func
};

export default CustomPicker(WidgetColorBox);
