import React from 'react';
import ReactDOM from 'react-dom';
import FloatingPanel from '../../FloatingPanel';
import ColorPicker from './ColorPicker';

import {
    setCodeMirrorValue,
    setCodeMirrorShaderValue,
    getCoordinates,
    setCursor
} from '../../../editor/editor';
import Color from './color';
// import { EventEmitter } from '../../event-emitter';

/**
 * Represents a color picker widget
 */
export default class ColorBookmark extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);

        this.state = {
            displayColorPicker: this.props.shader, // If it's a shader widget, defaults to TRUE, open. If it's not a shader widget, it's FALSE. we need to wait until user clicks button to open widget
            color: new Color(this.props.value),
        };
        this.bookmark = this.props.bookmark;
        this.mounted = true;
        this.x = 0;
        this.y = 0;

        // Need to know width in case a widget is about to get rendered outside of the normal screen size
        // TODO: Don't hardcode this.
        this.height = 300;
        this.width = 250;

        this.onClick = this.onClick.bind(this);
        this.onClickExit = this.onClickExit.bind(this);
        this.onChange = this.onChange.bind(this);
        // this.onPaletteChange = this.onPaletteChange.bind(this);

        /* This section is for the shader widget-links */
        if (this.props.shader) {
            this.cursor = this.props.cursor;
            this.match = this.props.match;

            // Position where user clicked on a line
            const linePos = { line: this.cursor.line, ch: this.match.start };
            this.x = getCoordinates(linePos).left;
            this.y = getCoordinates(linePos).bottom;
        }
    }

    /**
     * React lifecycle function. Gets called once when DIV is mounted
     */
    componentDidMount () {
        // Colorpalette section
        /*
        // Only pass on colors that are valid. i.e. as the user types the color widget is white by default but
        // the widget does not representa  fully valid color
        if (this.state.color.valid) {
            EventEmitter.dispatch('widgets:color', this.state.color);
        }

        EventEmitter.subscribe('color-palette:color-change', data => { this.onPaletteChange(data); });
        */
    }

    componentWillUnmount () {
        this.mounted = false;

        // Colorpalette section
        /*
        EventEmitter.dispatch('widgets:color-unmount', this.state.color);

        // Do nothing on color palette changes if the React component has been unmounted.
        // This is to prevent following error: 'Can only update a mounted or mounting component. This usually means you called setState() on an unmounted component.'
        EventEmitter.subscribe('color-palette:color-change', data => {});
        */
    }

    /**
     * Open or close the color picker widget
     */
    onClick (e) {
        // Set the editor cursor to the correct line. (When you click on the
        // widget button it doesn't move the cursor)
        setCursor(this.bookmark.widgetPos.from.line, this.bookmark.widgetPos.from.ch);

        // Every time user clicks, modal position has to be updated.
        // This is because the user might have scrolled the CodeMirror editor
        const bookmarkPosition = this.colorPickerBookmark.getBoundingClientRect();

        // Set the x and y of the modal that will contain the widget
        this.x = bookmarkPosition.left;
        this.y = bookmarkPosition.bottom;
        this.setState({ displayColorPicker: true });
    }

    onClickExit () {
        this.setState({ displayColorPicker: false });

        if (this.props.shader) {
            let widgetlink = document.getElementById('widget-links');
            ReactDOM.unmountComponentAtNode(widgetlink);
        }
    }

    /**
     * Function gets called any time the user changes a color in the color picker
     * widget
     *
     * @param newColor - color that user has chosen in the color picker widget. Object of type Color
     */
    onChange (newColor) {
        if (this.mounted) {
            // const oldColor = this.state.color; // For use within color palette
            this.setState({ color: newColor });

            if (this.props.shader && this.props.vec === 'vec3') {
                this.setEditorShaderValue(newColor.getVec3String());
            }
            else if (this.props.shader && this.props.vec === 'vec4') {
                this.setEditorShaderValue(newColor.getVec4String());
            }
            else {
                this.setEditorValue(newColor.getVecString());
            }

            // EventEmitter.dispatch('widgets:color-change', { old: oldColor, new: newColor });
        }
    }

    /**
     * Every time a user changes a color on the color palette, all color widgets
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

    /* SHARED METHOD FOR ALL WIDGETS */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    /**
     * Update CodeMirror. Keeping the function same name as we used in the other widget-links
     *
     * @param color - the color to update within a shader block
     */
    setEditorShaderValue (color) {
        const start = { line: this.cursor.line, ch: this.match.start };
        const end = { line: this.cursor.line, ch: this.match.end };
        this.match.end = this.match.start + color.length;
        setCodeMirrorShaderValue(color, start, end);
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        if (this.mounted) {
            const widgetStyle = { backgroundColor: this.state.color.getRgbaString() };

            return (
                <div>
                    {/* The widget button user clicks to open color picker */}
                    {(() => {
                        if (this.props.shader) {
                            return null;
                        }
                        else {
                            return (
                                <div
                                    className='widget bookmark-color'
                                    ref={(ref) => { this.colorPickerBookmark = ref; }}
                                    onClick={this.onClick}
                                    style={widgetStyle}
                                />
                            );
                        }
                    })()}

                    {/* Floating panel */}
                    <FloatingPanel
                        x={this.x}
                        y={this.y}
                        width={this.width}
                        height={this.height}
                        show={this.state.displayColorPicker}
                        onHide={this.onClickExit}
                    >
                        <ColorPicker color={ this.state.color } onChange={ this.onChange }/>
                    </FloatingPanel>
                </div>
            );
        }
    }
}

/**
 * Prop validation required by React
 */
ColorBookmark.propTypes = {
    bookmark: React.PropTypes.object,
    value: React.PropTypes.string,
    // These props are only used for the widget-links within the shader blocks
    shader: React.PropTypes.bool,
    display: React.PropTypes.bool,
    cursor: React.PropTypes.object,
    match: React.PropTypes.object,
    vec: React.PropTypes.string
};
