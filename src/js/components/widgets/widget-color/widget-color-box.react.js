// Class essentially taken from 'react-color': https://github.com/casesandberg/react-color/blob/master/src/components/sketched/Sketch.js

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { Hue, Alpha } from 'react-color/lib/components/common';
import Saturation from './widget-color-saturation.react';
import WidgetColorInputFields from './widget-color-input-fields.react';

class WidgetColorBox extends React.Component {
    constructor (props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onChangeHue = this.onChangeHue.bind(this);
        this.onChangeAlpha = this.onChangeAlpha.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    onChange (data) {
        this.props.onChange(data);
    }

    onChangeHue (data) {
        this.props.onChange({
            h: data.h,
            s: data.s,
            l: data.l
        });
    }

    onChangeAlpha (data) {
        const color = this.props.color.getRgba();
        this.props.onChange({
            r: color.r,
            g: color.g,
            b: color.b,
            a: data.a
        });
    }

    render () {
        return (
            <div className='widget-color-box'>
                <div className='saturation'>
                    <Saturation className='saturation2' color={this.props.color} onChange={ this.onChange }/>
                </div>
                <div className='controls flexbox-fix'>
                    <div className='sliders'>
                        <div className='hue'>
                            <Hue className='hue2' hsl={this.props.color.getHsl()} onChange={ this.onChangeHue } />
                        </div>
                        <div className='alpha'>
                            <Alpha className='alpha2' rgb={this.props.color.getRgba()} hsl={this.props.color.getHsl()} onChange={ this.onChangeAlpha } />
                        </div>
                    </div>
                    <div className='color'>
                        <div className='activeColor' style={{ backgroundColor: this.props.color.getRgbaString() }}/>
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
    color: React.PropTypes.object,
    onChange: React.PropTypes.func
};

export default WidgetColorBox;
