// Class essentially taken from 'react-color' https://github.com/casesandberg/react-color/blob/master/src/components/sketched/SketchFields.js

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { EditableInput } from 'react-color/lib/components/common';
import color from 'react-color/lib/helpers/color';

export default class WidgetColorInputFields extends React.Component {
    constructor (props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    onChange (data) {
        console.log("within color field");
        console.log(data);
        if (data.hex && color.isValidHex(data.hex)) {
            this.props.onChange({
                hex: data.hex,
                source: 'hex',
            });
        }
        else if (data.r || data.g || data.b) {
            this.props.onChange({
                r: data.r || this.props.rgb.r,
                g: data.g || this.props.rgb.g,
                b: data.b || this.props.rgb.b,
                a: this.props.rgb.a,
                source: 'rgb',
            });
        }
        else if (data.a) {
            if (data.a < 0) {
                data.a = 0;
            }
            else if (data.a > 100) {
                data.a = 100;
            }

            data.a = data.a / 100;
        }
    }

    render () {
        return (
            <div className='fields'>
                <div className='double'>
                    <EditableInput className='input' label='hex' value={ this.props.color.getHexString() } onChange={ this.onChange }/>
                </div>
                <div className='single'>
                    <EditableInput className='input' label='r' value={ this.props.color.getRgba().r } onChange={ this.onChange }/>
                </div>
                <div className='single'>
                    <EditableInput className='input' label='g' value={ this.props.color.getRgba().g } onChange={ this.onChange } />
                </div>
                <div className='single'>
                    <EditableInput className='input' label='b' value={ this.props.color.getRgba().b } onChange={ this.onChange } />
                </div>
                <div className='alpha3'>
                    <EditableInput is='input' label='a' value={ Math.round(this.props.color.getRgba().a * 100) } onChange={ this.onChange } />
                </div>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetColorInputFields.propTypes = {
    rgb: React.PropTypes.object,
    hsl: React.PropTypes.object,
    hex: React.PropTypes.string,
    onChange: React.PropTypes.func
};
