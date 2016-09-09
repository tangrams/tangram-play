import React from 'react';
import ReactDOM from 'react-dom';
import FloatingPanel from '../FloatingPanel';

import { getDevicePixelRatio } from '../../tools/common';
import { setCodeMirrorShaderValue, getCoordinates } from '../../editor/editor';

/**
 * Represents a widget link for a number
 * Gets created on click, as opposed to normal widgets that get created on editor parse
 */
export default class WidgetLinkNumber extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor(props) {
        super(props);
        this.state = {
            displayPicker: this.props.display,
        };

        this.cursor = this.props.cursor;
        this.match = this.props.match;

        const linePos = { line: this.cursor.line, ch: this.match.start }; // Position where user cliked on a line
        this.x = getCoordinates(linePos).left;
        this.y = getCoordinates(linePos).bottom;

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
        this.setValue(this.value);

        this.drag = false;

        this.onHide = this.onHide.bind(this);
        this.setValue = this.setValue.bind(this);
        this.drawCanvas = this.drawCanvas.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onWheel = this.onWheel.bind(this);
    }

    /**
     * React lifecycle method called once DIV is mounted
     */
    componentDidMount() {
        // Set canvas for high-pixel-density (e.g. Retina screens)
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx = this.canvas.getContext('2d');
        this.ratio = getDevicePixelRatio(this.ctx);
        this.canvas.width = this.width * this.ratio;
        this.canvas.height = this.height * this.ratio;
        this.ctx.scale(this.ratio, this.ratio);

        this.drawCanvas();
    }

    /* Mouse, scroll and click commands */
    /* These event callbacks are provided by React */

    /**
     * Widget links are handled slightly differently. For now they are simply unmounted from the DOM and recreated again
     * Meaning, onHide will only be called once to unmount the widget
     */
    onHide() {
        this.setState({ displayPicker: false });

        const widgetlink = document.getElementById('widget-links');
        ReactDOM.unmountComponentAtNode(widgetlink);
    }

    /**
     * Start of a drag event
     */
    onMouseDown(e) {
        this.drag = true; // START of a drag event
        this.overPoint = true; // Change the look of the point within the canvas

        const mousePos = this.getMousePos(this.canvas, e);
        this.prevOffset = mousePos.x;
        this.drawCanvas();
    }

    /**
     * While user is dragging
     */
    onMouseMove(e) {
        if (this.drag === true) { // If user is dragging mouse
            const mousePos = this.getMousePos(this.canvas, e);
            const x = mousePos.x;
            const vel = x - this.prevOffset;
            const offset = this.offsetX - vel;

            this.setValue(offset / this.center);
            this.prevOffset = x;

            this.drawCanvas();
            this.setEditorShaderValue(this.value.toFixed(3));
        }
    }

    /**
     * When user stops dragging
     */
    onMouseUp() {
        this.drag = false; // STOP a drag event
        this.overPoint = false; // Change the look of the point within the canvas
        this.drawCanvas(); // Draw the new point
    }


    /**
     * onMouseLeave accounts for the case where the user is still dragging but
     * outside of the widget. The drag event should end.
     */
    onMouseLeave() {
        this.drag = false;
        this.overPoint = false; // Change the look of the point within the canvas
        this.drawCanvas(); // Draw the new point
    }

    /**
     * When user scrolls wheel
     * TODO: fine tune this scroll function
     */
    onWheel(e) {
        // Prevent swipe nagivation on Chrome/Mac
        e.preventDefault();

        const x = e.deltaY;
        const offset = this.offsetX - x;

        this.setValue(offset / this.center);

        this.drawCanvas();
        this.setEditorShaderValue(this.value.toFixed(3));
    }

    /**
     * Set the value of the number
     *
     * @param value - new value to set our number to
     */
    setValue(value) {
        this.value = value;
        this.offsetX = this.value * this.center;
    }

    /**
     * Update CodeMirror
     *
     * @param string - the new number to write out to CodeMirror
     */
    setEditorShaderValue(string) {
        const start = { line: this.cursor.line, ch: this.match.start };
        const end = { line: this.cursor.line, ch: this.match.end };
        this.match.end = this.match.start + string.length;
        setCodeMirrorShaderValue(string, start, end);
    }

    /**
     * Function to get a mouse position within the canvas element
     */
    getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
        };
    }

    /**
     * Draws the canvas
     */
    drawCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5 + (this.height * 0.5));
        this.ctx.lineTo(0 + this.width, 0.5 + (this.height * 0.5));
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

        const times = 3;
        const unit = 40;
        const step = this.width / unit;
        const sections = unit * times;

        let offsetX = this.offsetX;

        if (Math.abs(this.offsetX - (this.width * 0.5)) > this.width * 0.5) {
            offsetX = ((this.offsetX - (this.width * 0.5)) % (this.width * 0.5)) + this.width;
        }

        this.ctx.strokeStyle = this.dimColor;
        this.ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            // TODO: refactor
            // eslint-disable-next-line max-len, no-nested-ternary
            const l = (i % (unit / 2) === 0) ? this.height * 0.35 : (i % (unit / 4) === 0) ? this.height * 0.2 : this.height * 0.1;
            this.ctx.moveTo((i * step) - offsetX, (this.height * 0.5) - l);
            this.ctx.lineTo((i * step) - offsetX, (this.height * 0.5) + l);
        }
        this.ctx.stroke();

        const val = Math.round(((this.value - this.min) / this.range) * this.width);

        // Zero line
        this.ctx.strokeStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const middle = this.width / 2;
        const xPos = (-(val - middle)) + middle;
        this.ctx.moveTo(xPos, this.height * 0.5);
        this.ctx.lineTo(xPos, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        // Zero point / text marker
        this.ctx.font = '14px Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('0', xPos, this.height / 2.5);

        this.overPoint = false;
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render() {
        return (
            <FloatingPanel
                x={this.x}
                y={this.y}
                width={this.width}
                height={this.height}
                show={this.state.displayPicker}
                onHide={this.onHide}
            >
                <canvas
                    className="widget-link-canvas"
                    ref={(ref) => { this.canvas = ref; }}
                    onMouseDown={this.onMouseDown}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp}
                    onMouseLeave={this.onMouseLeave}
                    onWheel={this.onWheel}
                />
            </FloatingPanel>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetLinkNumber.propTypes = {
    display: React.PropTypes.bool,
    cursor: React.PropTypes.object,
    match: React.PropTypes.object,
    value: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number,
    ]),
};
