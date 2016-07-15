import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../../draggable-modal.react';
import Icon from '../../icon.react';
import WidgetColorBox from './widget-color-box.react';

import { setCodeMirrorValue, editor } from '../../../editor/editor';
import ColorConverter from './color-converter';

/**
 * Represents a color picker widget
 */
export default class WidgetColor extends React.Component {
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
            displayColorPicker: false,
            color: this._processUserColor(this.props.bookmark.widgetInfo.value),
            x: 0,
            y: 0
        };
        this.bookmark = this.props.bookmark;
        this.height = 300; // Need to know width in case a widget is about to get rendered outside of the normal screen size

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    /**
     * Process the color text as the user types it out in Code Mirror. The color
     * text as typed by the user has to be converted to rgb values for the actual widget
     *
     * @param color - current color being typed by the user
     */
    _processUserColor (color) {
        // If a hex color
        if (color.charAt(0) === '\'' && (color.charAt(color.length - 1) === '\'')) {
            return color.replace(/'/g, '');
        }
        // If a vec color
        else if ((color.charAt(0) === '[') && (color.charAt(color.length - 1) === ']')) {
            let colorString = color;
            colorString = colorString.replace('[', '');
            colorString = colorString.replace(']', '');
            colorString = colorString.split(',');

            if (colorString.length >= 3) {
                let vec = { v: colorString[0], e: colorString[1], c: colorString[2] };
                let rgb = ColorConverter.vec2rgb(vec);
                rgb.a = 1.0; // We need to add an alpha by default so that the widget button can update css properly

                if (colorString.length === 4) {
                    rgb.a = parseFloat(colorString[3]);
                }
                return rgb;
            }

            return 'black';
        }
        // If a normal css color
        else {
            return color;
        }
    }

    /**
     * Open or close the color picker widget
     */
    handleClick () {
        // Every time user clicks, modal position has to be updated.
        // This is because the user might have scrolled the CodeMirror editor
        let linePos = { line: this.bookmark.widgetInfo.range.to.line, ch: this.bookmark.widgetInfo.range.to.ch }; // Position where user cliked on a line
        let currentX = editor.charCoords(linePos).left - 20;
        let currentY = editor.charCoords(linePos).bottom - 80;

        let el = document.getElementsByClassName('workspace-container')[0];
        let screenHeight = el.clientHeight;
        let maxheight = currentY + this.height + 80;
        // If the widget would render outside of the screen height
        if (maxheight > screenHeight) {
            currentY = screenHeight - this.height - 100; // Ofset the top position of the modal by a little
        }
        // Set the x and y of the modal that will contain the widget
        this.setState({ x: currentX });
        this.setState({ y: currentY });

        this.setState({ displayColorPicker: !this.state.displayColorPicker });
    }

    /**
     * Function gets called any time the user changes a color in the color picker
     * widget
     *
     * @param color - color that user has chosen in the color picker widget
     */
    handleChange (color) {
        this.setState({ color: color.rgb });

        let vecColor = ColorConverter.rgb2vec(color.rgb);
        let vecColorString = '[' + vecColor.v.toFixed(3) + ', ' + vecColor.e.toFixed(3) + ', ' + vecColor.c.toFixed(3) + ', ' + (color.rgb.a).toFixed(2) + ']';

        this._setEditorValue(vecColorString);
    }

    /* SHARED METHOD FOR ALL WIDGETS */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    _setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        let currentColor = this.state.color;
        let widgetStyle;

        if (currentColor.r !== undefined) {
            widgetStyle = { backgroundColor: 'rgba(' + parseInt(currentColor.r) + ',' + parseInt(currentColor.g) + ',' + parseInt(currentColor.b) + ',' + currentColor.a + ')' };
        }
        else {
            // Have to parse a color correctly if it is a number in order to pass on as a css style
            let colorCheck = parseFloat(this.state.color);

            // if the color is represented as a number and not HEX or any other format
            if (!isNaN(colorCheck)) {
                widgetStyle = { backgroundColor: colorCheck };
            }
            else {
                widgetStyle = { backgroundColor: this.state.color };
            }
        }

        return (
            <div>
                {/* The widget button user clicks to open color picker */}
                <div className='widget widget-colorpicker' onClick={ this.handleClick } style={widgetStyle}></div>

                {/* Draggable modal */}
                <Modal id='modal-test' dialogComponentClass={DraggableModal} x={this.state.x} y={this.state.y} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker} onHide={this.handleClick}>
                    <div className='drag'>
                        <Button onClick={ this.handleClick } className='widget-exit'><Icon type={'bt-times'} /></Button>
                    </div>
                    {/* The actual color picker */}
                    <WidgetColorBox className={'widget-color-picker'} color={ this.state.color } onChange={ this.handleChange }/>
                </Modal>
            </div>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetColor.propTypes = {
    bookmark: React.PropTypes.object
};
