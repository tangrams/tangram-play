// Basically taken from https://github.com/casesandberg/react-color/blob/master/src/components/common/Saturation.js

import React from 'react';
import ReactCSS from 'reactcss';
import throttle from 'lodash.throttle';
import shallowCompare from 'react-addons-shallow-compare';

export default class Saturation extends React.Component{

    constructor (props) {
        super(props);

        this.throttle = throttle(function (fn, data) {
            fn(data)
        }, 50);

        this.onChange = this.onChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    shouldComponentUpdate () {
        return shallowCompare.bind(this, this, arguments[0], arguments[1]);
    }

    componentWillUnmount() {
        this.unbindEventListeners();
    }

    onChange (e, skip) {
        if (!skip) {
            e.preventDefault();
        }

        var container = this.refs.container;
        const containerWidth = 220
        const containerHeight = 165
        var x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX
        var y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY
        var left = x - (container.getBoundingClientRect().left + window.pageXOffset)
        var top = y - (container.getBoundingClientRect().top + window.pageYOffset)

        if (left < 0) {
          left = 0;
        }
        else if (left > containerWidth) {
          left = containerWidth;
        }
        else if (top < 0) {
          top = 0;
        }
        else if (top > containerHeight) {
          top = containerHeight;
        }

        var saturation = left * 100 / containerWidth;
        var bright = -(top * 100 / containerHeight) + 100;

        this.throttle(this.props.onChange, {
            h: this.props.color.getHsv().h,
            s: saturation,
            v: bright
        });
    }


    onMouseDown (e) {
        this.onChange(e, true);
        window.addEventListener('mousemove', this.onChange);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseUp () {
        this.unbindEventListeners();
    }

    unbindEventListeners() {
        window.removeEventListener('mousemove', this.onChange);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    render () {
        let style1 = { background: 'hsl(' + this.props.color.getHsl().h + ',100%, 50%)' };
        let style2 = {
            top: -(this.props.color.getHsv().v * 100) + 100 + '%',
            left: this.props.color.getHsv().s * 100 + '%',
        };

        var pointer = <div className='circle' />

        return (
            <div className='widget-color-saturation' ref='container' onMouseDown={ this.onMouseDown }
                onTouchMove={ this.onChange }
                onTouchStart={ this.onChange } style={style1}>
                <div className='white'>
                    <div className='black' />
                    <div className='pointer' ref='pointer' style={style2}> { pointer } </div>
                </div>
            </div>
        )
    }
}

export default Saturation;
