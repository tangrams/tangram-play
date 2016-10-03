// Component borrowed & modified from https://github.com/casesandberg/react-color/blob/master/src/components/common/Saturation.js
import React from 'react';

export default class ColorPickerSaturation extends React.PureComponent {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    componentDidMount() {
        // Record height and width of the saturation area for calculations.
        // This is initially set in CSS. It should not change.
        const boundingBox = this.container.getBoundingClientRect();
        this.width = boundingBox.width;
        this.height = boundingBox.height;
    }

    componentWillUnmount() {
        this.unbindEventListeners();
    }

    onChange(e, skip) {
        if (!skip) {
            e.preventDefault();
        }

        // left and top position can change as user moves colorpicker
        // around, so always get new values for this.
        const boundingBox = this.container.getBoundingClientRect();
        const x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX;
        const y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY;
        let left = x - boundingBox.left;
        let top = y - boundingBox.top;

        if (left < 0) {
            left = 0;
        } else if (left > this.width) {
            left = this.width;
        } else if (top < 0) {
            top = 0;
        } else if (top > this.height) {
            top = this.height;
        }

        const saturation = (left * 100) / this.width;
        const bright = -((top * 100) / this.height) + 100;

        // This component only changes saturation and value,
        // so only report this back to the onChange handler. Do not
        // obtain hue and alpha and report it back here, since these
        // values do not live on this component and trying to get them
        // just to report them is error-prone.
        this.props.onChange({
            s: saturation,
            v: bright,
        });
    }

    onMouseDown(e) {
        this.onChange(e, true);
        window.addEventListener('mousemove', this.onChange);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseUp() {
        this.unbindEventListeners();
    }

    unbindEventListeners() {
        window.removeEventListener('mousemove', this.onChange);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    render() {
        // Do not use the hue value from props.color, because tinycolor2
        // resets hue to 0 if either s=0 or v=0. We must set this explicitly.
        const containerStyle = {
            background: `hsl(${this.props.hue}, 100%, 50%)`,
        };

        const color = this.props.color.getHsv();
        const topPosition = -(color.v * 100) + 100;
        const leftPosition = color.s * 100;
        const pointerStyle = {
            top: `${topPosition}%`,
            left: `${leftPosition}%`,
        };

        return (
            <div
                className="colorpicker-saturation"
                ref={(ref) => { this.container = ref; }}
                onMouseDown={this.onMouseDown}
                onTouchMove={this.onChange}
                onTouchStart={this.onChange}
                style={containerStyle}
            >
                <div className="colorpicker-saturation-white">
                    <div className="colorpicker-saturation-black" />
                    <div className="colorpicker-saturation-pointer" style={pointerStyle}>
                        <div className="colorpicker-saturation-circle" />
                    </div>
                </div>
            </div>
        );
    }
}

ColorPickerSaturation.propTypes = {
    hue: React.PropTypes.number,
    color: React.PropTypes.object,
    onChange: React.PropTypes.func,
};
