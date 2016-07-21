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
        if (data.hex && color.isValidHex(data.hex)) {
            this.props.onChange({
                hex: data.hex,
                source: 'hex',
            });
        }
        else if (data.r || data.g || data.b || data.a) {
            let a = parseInt(data.a);

            if (a === 0) {
                this.props.onChange({
                    r: data.r || color.r,
                    g: data.g || color.g,
                    b: data.b || color.b,
                    a: 0.0
                });
            }
            else {
                this.props.onChange({
                    r: data.r || color.r,
                    g: data.g || color.g,
                    b: data.b || color.b,
                    a: (a / 100) || color.a
                });
            }
        }
    }

    render () {
        return (
            <div className='fields'>
                <div className='double'>
                    <EditableInput className='input' label='hex' value={ this.props.hex.replace('#', '') } onChange={ this.onChange }/>
                </div>
                <div className='single'>
                    <EditableInput className='input' label='r' value={ this.props.rgb.r } onChange={ this.onChange }/>
                </div>
                <div className='single'>
                    <EditableInput className='input' label='g' value={ this.props.rgb.g } onChange={ this.onChange } />
                </div>
                <div className='single'>
                    <EditableInput className='input' label='b' value={ this.props.rgb.b } onChange={ this.onChange } />
                </div>
                <div className='alpha3'>
                    <EditableInput is='input' label='a' value={ Math.round(this.props.rgb.a * 100) } onChange={ this.onChange } />
                </div>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetColorInputFields.propTypes = {
    color: React.PropTypes.object,
    onChange: React.PropTypes.func
};
