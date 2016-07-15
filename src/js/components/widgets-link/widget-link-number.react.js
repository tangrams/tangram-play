import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../draggable-modal.react';
import Icon from '../icon.react';

import Vector from './vector';
import { editor } from '../../editor/editor';

/**
 * Represents a widget link for a number
 */
export default class WidgetLinkNumber extends React.Component {
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
            displayPicker: this.props.display
        };

        this.cursor = this.props.cursor;
        this.match = this.props.match;

        this.fnColor = 'rgb(230, 230, 230)';
        this.selColor = 'rgb(40, 168, 107)';
        this.dimColor = 'rgb(100, 100, 100)';

        this.width = 250;
        this.height = 40;

        this.min = -1;
        this.max = 1;
        this.range = this.max - this.min;
        this.overPoint = false;
        this.prevOffset = 0;
        this.prevWheelOffset = 0;
        this.scale = 2;
        this.center = (this.width / this.scale);
        this.offsetX = this.value * this.center;

        this.value = parseFloat(this.props.value);
        this._setValue(this.value);

        this.drag = false;

        this.handleClick = this.handleClick.bind(this);
        this._setValue = this._setValue.bind(this);
        this._drawCanvas = this._drawCanvas.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onWheel = this.onWheel.bind(this);
    }

    /**
     * React lifecycle method called once DIV is mounted
     */
    componentDidMount () {
        this._drawCanvas();
    }

    /**
     * Draws the canvas
     */
    _drawCanvas () {
        this.ctx = this.refs.canvas.getContext('2d');
        this.ctx.clearRect(0, 0, this.width, this.height);

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5 + this.height * 0.5);
        this.ctx.lineTo(0 + this.width, 0.5 + this.height * 0.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // vertical line
        this.ctx.strokeStyle = this.fnColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.5, 0);
        this.ctx.lineTo(this.width * 0.5, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        // Triangle line
        this.ctx.fillStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.5, 5);
        this.ctx.lineTo(this.width * 0.48, 0);
        this.ctx.lineTo(this.width * 0.52, 0);
        this.ctx.closePath();
        this.ctx.fill();

        let times = 3;
        let unit = 40;
        let step = this.width / unit;
        let sections = unit * times;

        let offsetX = this.offsetX;

        if (Math.abs(this.offsetX - this.width * 0.5) > this.width * 0.5) {
            offsetX = (this.offsetX - this.width * 0.5) % (this.width * 0.5) + this.width;
        }

        this.ctx.strokeStyle = this.dimColor;
        this.ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            let l = (i % (unit / 2) === 0) ? this.height * 0.35 : (i % (unit / 4) === 0) ? this.height * 0.2 : this.height * 0.1;
            this.ctx.moveTo(i * step - offsetX, this.height * 0.5 - l);
            this.ctx.lineTo(i * step - offsetX, this.height * 0.5 + l);
        }
        this.ctx.stroke();

        let val = Math.round(((this.value - this.min) / this.range) * this.width);

        // point
        this.ctx.strokeStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX + val, this.height * 0.5);
        this.ctx.lineTo(this.offsetX + val, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        this.overPoint = false;
    }

    /**
     * Set the value of the number
     *
     * @param value - new value to set our number to
     */
    _setValue (value) {
        this.value = value;
        this.offsetX = this.value * this.center;
    }

    /**
     * Update CodeMirror
     *
     * @param string - the new number to write out to CodeMirror
     */
    _updateEditor (string) {
        let start = { line: this.cursor.line, ch: this.match.start };
        let end = { line: this.cursor.line, ch: this.match.end };
        this.match.end = this.match.start + string.length;
        editor.replaceRange(string, start, end);
    }

    /* Mouse, scroll and click commands */
    /* These event callbacks are provided by React */

    /**
     * Widget links are handled slightly differently. For now they are simply unmounted from the DOM and recreated again
     * Meaning, handleClick will only be called once to unmount the widget
     */
    handleClick () {
        this.setState({ displayPicker: !this.state.displayPicker });

        let widgetlink = document.getElementById('widget-links');
        ReactDOM.unmountComponentAtNode(widgetlink);
    }

    /**
     * Start of a drag event
     */
    onMouseDown (e) {
        this.drag = true; // START of a drag event
        this.overPoint = true; // Change the look of the point within the canvas

        let mousePos = this._getMousePos(this.refs.canvas, e);
        this.prevOffset = mousePos.x;
        this._drawCanvas();
    }

    /**
     * While user is dragging
     */
    onMouseMove (e) {
        if (this.drag === true) { // If user is dragging mouse
            let mousePos = this._getMousePos(this.refs.canvas, e);

            let x = mousePos.x;

            let vel = x - this.prevOffset;
            let offset = this.offsetX - vel;

            this._setValue(offset / this.center);
            this.prevOffset = x;

            this._drawCanvas();
            this._updateEditor(this.value.toFixed(3));
        }
    }

    /**
     * When user stops dragging
     */
    onMouseUp () {
        this.drag = false; // STOP a drag event
        this.overPoint = false; // Change the look of the point within the canvas
        this._drawCanvas(); // Draw the new point
    }


    /**
     * onMouseLeave accounts for the case where the user is still dragging but outside of the widget. The drag event should end.
     */
    onMouseLeave () {
        this.drag = false;
        this.overPoint = false; // Change the look of the point within the canvas
        this._drawCanvas(); // Draw the new point
    }

    /**
     * Function to get a mouse position within the canvas element
     */
    _getMousePos (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    /**
     * When user srolls wheel
     * TODO: fine tune this scroll function
     */
    onWheel (e) {
        let x = e.deltaY;

        let vel = x - this.prevWheelOffset;
        let offset = this.offsetX - vel;

        this._setValue(offset / this.center);
        // this.prevOffset = x;

        this._drawCanvas();
        this._updateEditor(this.value.toFixed(3));

        this.prevWheelOffset = e.deltaY - this.prevWheelOffset;
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        return (
            <Modal id='modal-test' dialogComponentClass={DraggableModal} enforceFocus={false} className='widget-modal' show={this.state.displayPicker} onHide={this.handleClick}>
                <div className='drag'>
                    <Button onClick={ this.handleClick } className='widget-exit'><Icon type={'bt-times'} /></Button>
                </div>
                {/* The actual widget link */}
                <canvas className='widget-link-canvas' ref='canvas' width={this.width} height={this.height} onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove} onMouseUp={this.onMouseUp} onMouseLeave={this.onMouseLeave} onWheel={this.onWheel}/>
            </Modal>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetLinkNumber.propTypes = {
    display: React.PropTypes.bool,
    cursor: React.PropTypes.object,
    match: React.PropTypes.object
};
