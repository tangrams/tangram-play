// Class essentially taken from 'react-color': https://github.com/casesandberg/react-color/blob/master/src/components/sketched/Sketch.js

import React from 'react';
import { Hue, Alpha } from 'react-color/lib/components/common';
import ColorPickerSaturation from './ColorPickerSaturation';
import ColorPickerInputFields from './ColorPickerInputFields';
import Color from './color';

export default class ColorPicker extends React.PureComponent {
    constructor (props) {
        super(props);
        this.onChangeSaturation = this.onChangeSaturation.bind(this);
        this.onChangeHueAlpha = this.onChangeHueAlpha.bind(this);
        this.onChangeInputs = this.onChangeInputs.bind(this);
    }

    onChangeSaturation (data) {
        let color = new Color({ h: data.h, s: data.s, v: data.v });
        color.setAlpha(data.a);
        this.props.onChange(color);
    }

    onChangeHueAlpha (data) {
        let color = new Color({ h: data.h, s: data.s, l: data.l });
        color.setAlpha(data.a);
        this.props.onChange(color);
    }

    onChangeInputs (data) {
        // If data comes as RGBA object
        if (data.hasOwnProperty('r')) {
            const color = new Color({ r: data.r, g: data.g, b: data.b, a: data.a });
            this.props.onChange(color);
        }
        // Else if its a hex string
        else {
            const color = new Color(data);
            this.props.onChange(color);
        }
    }

    render () {
        return (
            <div className='colorpicker-container'>
                <ColorPickerSaturation
                    color={this.props.color}
                    onChange={this.onChangeSaturation}
                />

                <div className='colorpicker-controls'>
                    <div className='colorpicker-sliders'>
                        <div className='colorpicker-slider-hue'>
                            <Hue
                                hsl={this.props.color.getHsl()}
                                onChange={this.onChangeHueAlpha}
                            />
                        </div>
                        <div className='colorpicker-slider-alpha'>
                            <Alpha
                                rgb={this.props.color.getRgba()}
                                hsl={this.props.color.getHsl()}
                                onChange={this.onChangeHueAlpha}
                            />
                        </div>
                    </div>
                    <div
                        className='colorpicker-active-color'
                        style={{ backgroundColor: this.props.color.getRgbaString() }}
                    />
                </div>

                <ColorPickerInputFields
                    {...this.props}
                    onChange={this.onChangeInputs}
                />
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
ColorPicker.propTypes = {
    color: React.PropTypes.object,
    onChange: React.PropTypes.func
};
