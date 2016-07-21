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

    onChange (data) {
        let color = this.props.color.getRgba();
        if (data.hex) {
            this.props.onChange({
                hex: data.hex
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
        let color = this.props.color.getRgba();
        let hex = this.props.color.getHexString();
        return (
            <div className='widget-color-box-fields'>
                <div className='widget-color-box-double'>
                    <EditableInput className='input' label='hex' value={ hex } onChange={ this.onChange }/>
                </div>
                <div className='widget-color-box-single'>
                    <EditableInput className='input' label='r' value={ color.r} onChange={ this.onChange }/>
                </div>
                <div className='widget-color-box-single'>
                    <EditableInput className='input' label='g' value={ color.g } onChange={ this.onChange } />
                </div>
                <div className='widget-color-box-single'>
                    <EditableInput className='input' label='b' value={ color.b } onChange={ this.onChange } />
                </div>
                <div className='widget-color-box-alpha'>
                    <EditableInput is='input' label='a' value={ Math.round(color.a * 100) } onChange={ this.onChange } />
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
