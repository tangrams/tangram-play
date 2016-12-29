/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import ReactDOM from 'react-dom';
import { Checkboard } from 'react-color/lib/components/common';
import FloatingPanel from '../../FloatingPanel';
import ColorPicker from './ColorPicker';

import {
  setCodeMirrorValue,
  setCodeMirrorShaderValue,
  getCoordinates,
  setCursor,
} from '../../../editor/editor';
import Color from './color';
// import EventEmitter from '../../event-emitter';

/**
 * Represents a color swatch text marker
 */
export default class ColorMarker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // If it's a shader widget, defaults to TRUE, open. If it's not a
      // shader widget, it's FALSE. we need to wait until user clicks
      // button to open widget
      displayColorPicker: this.props.shader,
      color: new Color(this.props.value),
    };
    this.mounted = true;
    this.x = 0;
    this.y = 0;

    // Need to know width in case a widget is about to get rendered outside
    // of the normal screen size
    // TODO: Don't hardcode this.
    this.height = 300;
    this.width = 250;

    this.onClickTextMarker = this.onClickTextMarker.bind(this);
    this.onClickClose = this.onClickClose.bind(this);
    this.onChange = this.onChange.bind(this);
    // this.onPaletteChange = this.onPaletteChange.bind(this);

    /* This section is for the GLSL pickers */
    if (this.props.shader) {
      this.cursor = this.props.cursor;
      this.match = this.props.match;

      // Position where user clicked on a line
      const linePos = { line: this.cursor.line, ch: this.match.start };
      this.x = getCoordinates(linePos).left;
      this.y = getCoordinates(linePos).bottom;
    }
  }

  componentDidMount() {
    // Colorpalette section
    /*
    // Only pass on colors that are valid. i.e. as the user types the color
    // widget is white by default but
    // the widget does not representa  fully valid color
    if (this.state.color.valid) {
        EventEmitter.dispatch('widgets:color', this.state.color);
    }

    EventEmitter.subscribe('color-palette:color-change',
        data => { this.onPaletteChange(data); });
    */
  }

  componentWillUnmount() {
    this.mounted = false;

    // Colorpalette section
    /*
    EventEmitter.dispatch('widgets:color-unmount', this.state.color);

    // Do nothing on color palette changes if the React component has been unmounted.
    // This is to prevent following error: 'Can only update a mounted or
    // mounting component. This usually means you called setState() on an unmounted component.'
    EventEmitter.subscribe('color-palette:color-change', data => {});
    */
  }

  /**
   * Open or close the color picker
   */
  onClickTextMarker() {
    // Set the editor cursor to the correct line. (When you click on the
    // text marker it doesn't move the cursor)
    const pos = this.props.marker.find();
    setCursor(pos.line, pos.ch);

    // Every time user clicks, colorpicker popup position has to be updated.
    // This is because the user might have scrolled the CodeMirror editor
    const pickerRect = this.markerEl.getBoundingClientRect();

    // Set the x and y of the colorpicker popup
    this.x = pickerRect.left;
    this.y = pickerRect.bottom;
    this.setState({ displayColorPicker: true });
  }

  onClickClose() {
    this.setState({ displayColorPicker: false });

    if (this.props.shader) {
      ReactDOM.unmountComponentAtNode(document.getElementById('glsl-pickers'));
    }
  }

  /**
   * Function gets called any time the user changes a color in the color picker
   * widget
   *
   * @param newColor - color that user has chosen in the color picker. Object of type Color
   */
  onChange(newColor) {
    if (this.mounted) {
      // const oldColor = this.state.color; // For use within color palette
      this.setState({ color: newColor });

      if (this.props.shader && this.props.vec === 'vec3') {
        this.setEditorShaderValue(newColor.getVec3String());
      } else if (this.props.shader && this.props.vec === 'vec4') {
        this.setEditorShaderValue(newColor.getVec4String());
      } else {
        this.setEditorValue(newColor.getVecString());
      }

      // EventEmitter.dispatch('widgets:color-change', { old: oldColor, new: newColor });
    }
  }

  /**
   * Every time a user changes a color on the color palette, all color pickers
   * need to check whether that change applies to their own internal color
   *
   * @param data - the new color the user has chosen
   */
  /*
  onPaletteChange (data) {
      if (this.mounted) {
          if (data.old.getRgbaString() === this.state.color.getRgbaString()) {
              this.setState({ color: data.new });
              this.setEditorValue(data.new.getVecString());
          }
      }
  }
  */

  /* SHARED METHOD FOR ALL PICKERS */
  /**
   *  Use this method within a picker to communicate a value
   *  back to the Tangram Play editor.
   */
  setEditorValue(value) {
    setCodeMirrorValue(this.props.marker, value);
  }

  /**
   * Update CodeMirror. Keeping the function same name as we used in the other GLSL pickers
   *
   * @param color - the color to update within a shader block
   */
  setEditorShaderValue(color) {
    const start = { line: this.cursor.line, ch: this.match.start };
    const end = { line: this.cursor.line, ch: this.match.end };
    this.match.end = this.match.start + color.length;
    setCodeMirrorShaderValue(color, start, end);
  }

  render() {
    if (!this.mounted) return null;

    const colorStyle = { backgroundColor: this.state.color.getRgbaString() };

    return (
      <div>
        {/* The button user clicks to open color picker */}
        {(() => {
          if (this.props.shader) {
            return null;
          }

          return (
            <div
              className="textmarker textmarker-color"
              ref={(ref) => { this.markerEl = ref; }}
              onClick={this.onClickTextMarker}
            >
              <Checkboard size="3" />
              <div className="textmarker-color-swatch" style={colorStyle} />
            </div>
          );
        })()}

        {/* Floating panel */}
        <FloatingPanel
          x={this.x}
          y={this.y}
          width={this.width}
          height={this.height}
          show={this.state.displayColorPicker}
          onClickClose={this.onClickClose}
        >
          <ColorPicker color={this.state.color} onChange={this.onChange} />
        </FloatingPanel>
      </div>
    );
  }
}

ColorMarker.propTypes = {
  marker: React.PropTypes.shape({
    find: React.PropTypes.func,
  }),
  // The value may be a string, or an array of string values.
  value: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.arrayOf(React.PropTypes.string),
  ]).isRequired,
  // These props are only used for GLSL pickers within the shader blocks
  shader: React.PropTypes.bool,
  cursor: React.PropTypes.shape({
    line: React.PropTypes.number,
  }),
  match: React.PropTypes.shape({
    start: React.PropTypes.number,
    end: React.PropTypes.number,
  }),
  vec: React.PropTypes.string,
};

ColorMarker.defaultProps = {
  shader: false,
};
