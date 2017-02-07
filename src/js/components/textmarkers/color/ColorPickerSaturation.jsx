// Component borrowed & modified from https://github.com/casesandberg/react-color/blob/master/src/components/common/Saturation.js
import React from 'react';

export default class ColorPickerSaturation extends React.Component {
  constructor(props) {
    super(props);

    // State records pointer position
    this.state = {
      saturation: 0,
      brightness: 0,
    };

    this.onChange = this.onChange.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.setBoundingBox = this.setBoundingBox.bind(this);
    this.setPointerPosition = this.setPointerPosition.bind(this);
  }

  componentWillMount() {
    this.setPointerPosition(this.props.color);
  }

  componentDidMount() {
    // Record height and width of the saturation area for calculations.
    // This is initially set in CSS. It should not change.
    this.setBoundingBox();
    this.width = this.boundingBox.width;
    this.height = this.boundingBox.height;
  }

  componentWillReceiveProps(nextProps) {
    this.setPointerPosition(nextProps.color);
  }

  componentWillUnmount() {
    this.unbindEventListeners();
  }

  onChange(e, skip) {
    if (!skip) {
      e.preventDefault();
    }

    // Read bounding box from cached value (rather than each onChange call).
    // Make sure it is set to a correct value before any interaction begins.
    const boundingBox = this.boundingBox;
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

    // Color parser in parent component (tinycolor2) expects values 0-100
    const saturation = (left * 100) / this.width;
    const brightness = -((top * 100) / this.height) + 100;

    // Record this for pointer position
    this.setState({ saturation, brightness });

    // This component only changes saturation and value,
    // so only report this back to the onChange handler. Do not
    // obtain hue and alpha and report it back here, since these
    // values do not live on this component and trying to get them
    // just to report them is error-prone.
    this.props.onChange({
      s: saturation,
      v: brightness,
    });
  }

  onMouseDown(e) {
    this.setBoundingBox();
    this.onChange(e, true);
    window.addEventListener('mousemove', this.onChange);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseUp() {
    this.unbindEventListeners();
  }

  onTouchStart() {
    this.setBoundingBox();
    this.onChange();
  }

  // Bounding box value of this component can vary if user moves it around
  // the screen, so cache the bounding box value before the start of any
  // touch or mouse interaction. We want to make sure this is read as little
  // as possible to help prevent layout thrashing.
  setBoundingBox() {
    this.boundingBox = this.container.getBoundingClientRect();
  }

  setPointerPosition(color) {
    const hsv = color.getHsv();

    // Record this for pointer position
    // Values are retrieved between 0-1 so scale them up to 0-100
    this.setState({
      saturation: hsv.s * 100,
      brightness: hsv.v * 100,
    });
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

    // Convert saturation and brightness to a position. These are recorded
    // on a scale of 0-100 so it's really easy to use percentage values.
    // Values are clamped to ensure it never goes below 0 or above 100.
    // We use the internal state rather than the color reported by tinycolor2
    // because the way color math works can cause distortions in where
    // the pointer is positioned.
    const pointerStyle = {
      top: `${Math.max(0, Math.min(100, 100 - this.state.brightness))}%`,
      left: `${Math.max(0, Math.min(100, this.state.saturation))}%`,
    };

    return (
      <div
        className="colorpicker-saturation"
        ref={(ref) => { this.container = ref; }}
        onMouseDown={this.onMouseDown}
        onTouchMove={this.onChange}
        onTouchStart={this.onTouchStart}
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
  hue: React.PropTypes.number.isRequired,
  color: React.PropTypes.objectOf(React.PropTypes.any).isRequired,
  onChange: React.PropTypes.func,
};

ColorPickerSaturation.defaultProps = {
  onChange: function noop() {},
};
