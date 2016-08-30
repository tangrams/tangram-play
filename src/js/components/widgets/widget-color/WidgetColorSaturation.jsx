// Class essentially taken from https://github.com/casesandberg/react-color/blob/master/src/components/common/Saturation.js
import React from 'react';

export default class Saturation extends React.PureComponent {
    constructor (props) {
        super(props);

        // TODO: don't harcode. These numbers are duplicated in CSS.
        this.width = 230;
        this.height = 165;

        this.onChange = this.onChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    componentWillUnmount () {
        this.unbindEventListeners();
    }

    onChange (e, skip) {
        if (!skip) {
            e.preventDefault();
        }

        const container = this.container;
        const boundingBox = container.getBoundingClientRect();
        let x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX;
        let y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY;
        let left = x - boundingBox.left;
        let top = y - boundingBox.top;

        if (left < 0) {
            left = 0;
        }
        else if (left > this.width) {
            left = this.width;
        }
        else if (top < 0) {
            top = 0;
        }
        else if (top > this.height) {
            top = this.height;
        }

        const saturation = left * 100 / this.width;
        const bright = -(top * 100 / this.height) + 100;

        this.props.onChange({
            h: this.props.color.getHsv().h,
            s: saturation,
            v: bright,
            a: this.props.color.getRgba().a
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

    unbindEventListeners () {
        window.removeEventListener('mousemove', this.onChange);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    render () {
        const style1 = { background: 'hsl(' + this.props.color.getHsl().h + ',100%, 50%)' };
        const style2 = {
            top: -(this.props.color.getHsv().v * 100) + 100 + '%',
            left: this.props.color.getHsv().s * 100 + '%'
        };

        return (
            <div
                className='colorpicker-saturation'
                ref={(ref) => { this.container = ref; }}
                onMouseDown={this.onMouseDown}
                onTouchMove={this.onChange}
                onTouchStart={this.onChange}
                style={style1}
            >
                <div className='colorpicker-saturation-white'>
                    <div className='colorpicker-saturation-black' />
                    <div className='colorpicker-saturation-pointer' style={style2}>
                        <div className='colorpicker-saturation-circle' />
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
Saturation.propTypes = {
    color: React.PropTypes.object,
    onChange: React.PropTypes.func
};

export default Saturation;
