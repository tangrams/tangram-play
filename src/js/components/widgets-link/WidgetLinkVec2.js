import React from 'react';
import ReactDOM from 'react-dom';
import FloatingPanel from '../FloatingPanel';

import Vector from './vector';

import { getDevicePixelRatio } from '../../tools/common';
import { setCodeMirrorShaderValue, getCoordinates } from '../../editor/editor';

/**
 * Represents a widget link for a vec2
 * Gets created on click, as opposed to normal widgets that get created on editor parse
 */
export default class WidgetLinkVec2 extends React.Component {
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

        this.width = 200;
        this.height = 200;

        this.min = -1;
        this.max = 1;
        this.size = 6;
        this.range = this.max - this.min;
        this.overPoint = false;
        this.value = new Vector([0, 0]);

        this.drag = false;

        this.onHide = this.onHide.bind(this);
        this.setValue = this.setValue.bind(this);
        this.drawCanvas = this.drawCanvas.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        // Set the original value
        this.setValue(this.props.value);
    }

    /**
     * React lifecycle method called once DIV is mounted
     */
    componentDidMount() {
        // Set canvas for high-pixel-density (e.g. Retina screens)
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx = this.canvas.getContext('2d');
        this.ratio = getDevicePixelRatio(this.ctx);
        this.canvas.width = this.width * this.ratio;
        this.canvas.height = this.height * this.ratio;
        this.ctx.scale(this.ratio, this.ratio);

        // Once the canvas DIV is mounted, we can draw it
        this.drawCanvas();
    }

    /**
     * Draws the canvas
     */
    drawCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // frame
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);

        this.ctx.beginPath();
        this.ctx.lineWidth = 0.25;
        const sections = 20;
        const step = this.width / sections;
        for (let i = 0; i < sections; i++) {
            this.ctx.moveTo(i * step, 0);
            this.ctx.lineTo(i * step, this.height);
            this.ctx.moveTo(0, i * step);
            this.ctx.lineTo(this.width, i * step);
        }
        this.ctx.stroke();

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1.0;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5 + this.height * 0.5);
        this.ctx.lineTo(this.width, 0.5 + this.height * 0.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(0.5 + this.width * 0.5, 0);
        this.ctx.lineTo(0.5 + this.width * 0.5, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        let x = Math.round(((this.value.x - this.min) / this.range) * this.width);
        let y = Math.round(((1 - (this.value.y - this.min) / this.range)) * this.height);

        const half = this.size / 2;

        if (x < half) {
            x = half;
        }
        if (x > this.width - half) {
            x = this.width - half;
        }
        if (y < half) {
            y = half;
        }
        if (y > this.height - half) {
            y = this.height - half;
        }

        // point
        this.ctx.fillStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.beginPath();
        const radius = this.overPoint ? 4 : 3;
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Set the value of the point
     *
     * @param pos - takes in a position from which to create a vector
     */
    setValue(pos) {
        this.value = new Vector(pos);
    }

    /**
     * Update CodeMirror
     *
     * @param pos - the new position to write out to CodeMirror
     */
    setEditorShaderValue(pos) {
        const newpos = pos.getString();
        const start = { line: this.cursor.line, ch: this.match.start };
        const end = { line: this.cursor.line, ch: this.match.end };
        this.match.end = this.match.start + newpos.length;
        setCodeMirrorShaderValue(newpos, start, end);
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
     * We also want to update the canvas on MouseDown in case the user only clicks on the 2d axis and not drags inside of it
     */
    onMouseDown(e) {
        this.drag = true; // START a drag event
        this.overPoint = true; // Change the look of the point within the canvas

        const mousePos = this.getMousePos(this.canvas, e);
        const x = mousePos.x;
        const y = mousePos.y;

        this.value.x = ((this.range / this.width) * x) - (this.range - this.max);
        this.value.y = (((this.range / this.height) * y) - (this.range - this.max)) * -1;

        this.drawCanvas();
        this.setEditorShaderValue(this.value);
    }

    /**
     * While user is dragging
     */
    onMouseMove(e) {
        if (this.drag === true) { // If DRAG event is true
            const mousePos = this.getMousePos(this.canvas, e);
            const x = mousePos.x;
            const y = mousePos.y;

            this.value.x = ((this.range / this.width) * x) - (this.range - this.max);
            this.value.y = (((this.range / this.height) * y) - (this.range - this.max)) * -1;

            // this.overPoint = true;

            this.drawCanvas();
            this.setEditorShaderValue(this.value);
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
                />
            </FloatingPanel>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetLinkVec2.propTypes = {
    display: React.PropTypes.bool,
    cursor: React.PropTypes.object,
    match: React.PropTypes.object,
    value: React.PropTypes.string,
};
