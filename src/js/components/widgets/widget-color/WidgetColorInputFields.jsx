// Class essentially taken from 'react-color' https://github.com/casesandberg/react-color/blob/master/src/components/sketched/SketchFields.js

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { EditableInput } from 'react-color/lib/components/common';

export default class WidgetColorInputFields extends React.Component {
    constructor (props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    /**
     * Handle changes in input fields.
     * Signature of the `data` object passed in uses EditableInput's `label`
     * prop as the property name. e.g. `label='r'` becomes `data.r`. Do not
     * change these labels! (Use CSS to style these elements if necessary.)
     */
    onChange (data) {
        let color = this.props.color.getRgba();

        if (data.hex) {
            this.props.onChange(data.hex);
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
        const color = this.props.color.getRgba();
        const hex = this.props.color.getHexString();

        return (
            <div className='colorpicker-input-fields'>
                <div className='colorpicker-input-double'>
                    <EditableInput label='hex' value={hex} onChange={this.onChange} />
                </div>
                <div className='colorpicker-input-single'>
                    <EditableInput label='r' value={color.r} onChange={this.onChange} />
                </div>
                <div className='colorpicker-input-single'>
                    <EditableInput label='g' value={color.g} onChange={this.onChange} />
                </div>
                <div className='colorpicker-input-single'>
                    <EditableInput label='b' value={color.b} onChange={this.onChange} />
                </div>
                <div className='colorpicker-input-alpha'>
                    <EditableInput label='a' value={Math.round(color.a * 100)} onChange={this.onChange} />
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
