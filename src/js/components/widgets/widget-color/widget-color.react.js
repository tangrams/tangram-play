import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../../draggable-modal.react';
import Icon from '../../Icon';
import WidgetColorBox from './widget-color-box.react';

import { setCodeMirrorValue } from '../../../editor/editor';
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
            color: this.processUserColor(this.props.bookmark.widgetInfo.value),
            x: 0,
            y: 0
        };
        this.bookmark = this.props.bookmark;

        // Need to know width in case a widget is about to get rendered outside of the normal screen size
        // TODO: Don't hardcode this.
        this.height = 300;
        this.width = 250;

        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    /**
     * Process the color text as the user types it out in Code Mirror. The color
     * text as typed by the user has to be converted to rgb values for the actual widget
     *
     * @param color - current color being typed by the user
     */
    processUserColor (color) {
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
    onClick () {
        // Every time user clicks, modal position has to be updated.
        // This is because the user might have scrolled the CodeMirror editor

        // Magic numbers
        // Vertical distance in pixels to offset from the bookmark element
        const VERTICAL_POSITION_BUFFER = 5;

        // Vertical distance in pixels to correct for locking modal position to
        // the workspace area. This works in conjunction with a hard-coded
        // margin-top property on the modal to keep the modal in place.
        const WORKSPACE_VERTICAL_CORRECTION = 47;

        const bookmarkPos = this.bookmark.widgetNode.querySelector('.widget').getBoundingClientRect();
        let posX = bookmarkPos.left;
        let posY = bookmarkPos.bottom + VERTICAL_POSITION_BUFFER - WORKSPACE_VERTICAL_CORRECTION;

        const workspaceEl = document.getElementsByClassName('workspace-container')[0];
        const workspaceBounds = workspaceEl.getBoundingClientRect();
        const maxX = posX + this.width;
        const maxY = posY + this.height;

        // Check if the widget would render outside of the workspace container area
        if (maxX > workspaceBounds.width) {
            posX = workspaceBounds.width - this.width;
        }
        if (maxY > workspaceBounds.height) {
            posY = workspaceBounds.height - this.height;
        }

        // Set the x and y of the modal that will contain the widget
        this.setState({ x: posX });
        this.setState({ y: posY });
        this.setState({ displayColorPicker: !this.state.displayColorPicker });
    }

    /**
     * Function gets called any time the user changes a color in the color picker
     * widget
     *
     * @param color - color that user has chosen in the color picker widget
     */
    onChange (color) {
        this.setState({ color: color.rgb });

        let vecColor = ColorConverter.rgb2vec(color.rgb);
        let vecColorString = '[' + vecColor.v.toFixed(3) + ', ' + vecColor.e.toFixed(3) + ', ' + vecColor.c.toFixed(3) + ', ' + (color.rgb.a).toFixed(2) + ']';

        this.setEditorValue(vecColorString);
    }

    /* SHARED METHOD FOR ALL WIDGETS */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
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
                <div className='widget widget-colorpicker' onClick={ this.onClick } style={widgetStyle}></div>

                {/* Draggable modal */}
                <Modal id='modal-test' dialogComponentClass={DraggableModal} x={this.state.x} y={this.state.y} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker} onHide={this.onClick}>
                    <div className='drag'>
                        <Button onClick={ this.onClick } className='widget-exit'><Icon type={'bt-times'} /></Button>
                    </div>
                    {/* The actual color picker */}
                    <WidgetColorBox className={'widget-color-picker'} color={ this.state.color } onChange={ this.onChange }/>
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
