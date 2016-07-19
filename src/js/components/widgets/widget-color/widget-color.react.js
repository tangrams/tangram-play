import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../../draggable-modal.react';
import Icon from '../../icon.react';
import WidgetColorBox from './widget-color-box.react';

import { setCodeMirrorValue, editor } from '../../../editor/editor';
import Color from './color';
import { EventEmitter } from '../../event-emitter';

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
            color: new Color(this.props.bookmark.widgetInfo.value),
            x: 0,
            y: 0
        };
        this.bookmark = this.props.bookmark;
        this.height = 300; // Need to know width in case a widget is about to get rendered outside of the normal screen size

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handlePaletteChange = this.handlePaletteChange.bind(this);
    }

    componentDidMount () {
        // Only pass on colors that are valid. i.e. as the user types the color widget is white by default but
        // the widget does not representa  fully valid color
        if (this.state.color.valid) {
            EventEmitter.dispatch('widgets:color', this.state.color);
        }

        EventEmitter.subscribe('color-palette:color-change', data => { this.handlePaletteChange(data); });
    }

    componentWillUnmount () {
        EventEmitter.dispatch('widgets:color-unmount', this.state.color);
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
        let oldColor = this.state.color;
        let newColor = new Color(color.rgb);
        this.setState({ color: newColor });

        this._setEditorValue(newColor.getVecString());

        EventEmitter.dispatch('widgets:color-change', { old: oldColor, new: newColor });
    }

    handlePaletteChange (data) {
        if (data.old.getRgbaString() === this.state.color.getRgbaString()) {
            this.setState({ color: data.new });
            this._setEditorValue(data.new.getVecString());
        }
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
        let widgetStyle = { backgroundColor: this.state.color.getRgbaString() };

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
                    <WidgetColorBox className={'widget-color-picker'} color={ this.state.color.getRgba() } onChange={ this.handleChange }/>
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
