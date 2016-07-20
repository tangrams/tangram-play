import React from 'react';

import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from './draggable-modal.react';
import Icon from './icon.react';
import WidgetColorBox from './widgets/widget-color/widget-color-box.react';

import { EventEmitter } from './event-emitter';
import Color from './widgets/widget-color/color';

/**
 * Represents the color palette will all current colors in the Tangram yaml
 */
export default class ColorPalette extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            colors: [],
            currentColor: { // We need a default color for an initial rendering
                color: new Color('white'),
                count: 1
            },
            currentPosition: 0, // Keeps track of what color we are editing within the color palette array of colors
            displayPicker: false,
            x: 0, // X and Y positions for the color picker modal
            y: 0
        };

        this.onClick = this.onClick.bind(this);
        this.onHide = this.onHide.bind(this);
        this.onChange = this.onChange.bind(this);
        this.addNewColor = this.addNewColor.bind(this);
        this.changeColor = this.changeColor.bind(this);
        this.removeColor = this.removeColor.bind(this);
        this.clearColors = this.clearColors.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * Has to subscribe to color widget change events
     */
    componentDidMount () {
        EventEmitter.subscribe('widgets:color', data => { this.addNewColor(data); });
        EventEmitter.subscribe('widgets:color-unmount', data => { this.removeColor(data); });
        EventEmitter.subscribe('widgets:color-change', data => { this.changeColor(data); });
        EventEmitter.subscribe('tangram:clear-palette', this.clearColors);
    }

    /**
     * Called every time that a color widget is created
     *
     * @param data - the color created with the widget
     */
    addNewColor (data) {
        let colors = this.state.colors;

        for (let color of colors) {
            if (color.color.getRgbaString() === data.getRgbaString()) {
                color.count = color.count + 1;
                return;
            }
        }

        let newColor = {
            color: data,
            count: 1
        };

        colors.push(newColor);
        this.setState({ colors: colors });
    }

    /**
     * Called every time that a color widget is unmounted
     *
     * @param data - the color unmounted with the widget
     */
    removeColor (data) {
        let colors = this.state.colors;

        for (let i = 0; i < colors.length; i++) {
            if (colors[i].color.getRgbaString() === data.getRgbaString()) {
                if (colors[i].count === 1) {
                    colors.splice(i, 1);
                }
                else {
                    colors[i].count = colors[i].count - 1;
                }

                this.setState({ colors: colors });
                return;
            }
        }
    }

    /**
     * Called every time that a user changes a color using a color widget
     *
     * @param data - the colors the user changed
     */
    changeColor (data) {
        this.removeColor(data.old);
        this.addNewColor(data.new);
    }

    /**
     * Called every time that a color from the palette is chosen
     *
     * @param color - the current color the user wants to edit
     * @param i - the position of the current color within the color array
     * @param e - the click event
     */
    onClick (color, i, e) {
        // Set the x and y of the modal that will contain the widget
        const workspaceEl = document.getElementsByClassName('workspace-container')[0];
        const screenHeight = workspaceEl.clientHeight;
        const screenWidth = workspaceEl.clientWidth;

        // Magic numbers
        const COLOR_WIDTH = 22; // Width of each color div in the palette
        const HORIZONTAL_POSITION_BUFFER = 250; // Horizontal distance to offset palette color picker
        const VERTICAL_POSITION_BUFFER = 350; // Vertical distance to offset palette color picker

        // An approximation of x based on size of widget and place within array
        let x = (this.state.colors.length - i) * COLOR_WIDTH + HORIZONTAL_POSITION_BUFFER;
        this.setState({ x: (screenWidth - x) });
        this.setState({ y: (screenHeight - VERTICAL_POSITION_BUFFER) });

        // Log the currentColor being edited + the position of the color within our internal color array
        this.setState({ currentColor: color });
        this.setState({ currentPosition: i });

        this.setState({ displayPicker: !this.state.displayPicker });
    }

    /**
     * Called to close the color picker from the color palette
     */
    onHide () {
        this.setState({ displayPicker: !this.state.displayPicker });
    }

    /**
     * Called when a user changes a color using the color picker. It affects the current color palette
     *
     * @param color - the new color
     */
    onChange (color) {
        // Set the color picker to whatever new color the user has picked
        let oldColor = this.state.currentColor;
        let newColor = {
            color: new Color(color.rgb),
            count: 1
        };
        this.setState({ currentColor: newColor });

        // Then update the current color array with the new color
        let newColors = this.state.colors;
        newColors[this.state.currentPosition] = newColor;
        this.setState({ colors: newColors });

        // Alert each individual widget to that a color has changed
        // Each widget will have to check if the change applies to itself
        EventEmitter.dispatch('color-palette:color-change', { old: oldColor.color, new: newColor.color });
    }

    /**
     * Resets the color picker when a new scene has loaded
     */
    clearColors () {
        this.setState({ colors: [] });
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        let colors = [];
        if (this.state.colors) {
            for (let i = 0; i < this.state.colors.length; i++) {
                let color = this.state.colors[i];
                let widgetStyle = { backgroundColor: color.color.getRgbaString() };

                // This represents each squared div for a color in the color palette
                colors.push(<div key={i} className='palette-color' onClick={ this.onClick.bind(null, color, i) }><div className='square' style={widgetStyle}></div></div>);
            }
        }

        return (
            <div>
                <div className='colors'>
                    { colors }
                </div>
                {/* Draggable modal */}
                <Modal id='modal-test' dialogComponentClass={DraggableModal} x={this.state.x} y={this.state.y} enforceFocus={false} className='widget-modal' show={this.state.displayPicker} onHide={this.onHide}>
                    <div className='drag'>
                        <Button onClick={ this.onHide } className='widget-exit'><Icon type={'bt-times'} /></Button>
                    </div>
                    {/* The actual color picker */}
                    <WidgetColorBox className={'widget-color-picker'} color={ this.state.currentColor.color.getRgba() } onChange={ this.onChange }/>
                </Modal>
            </div>
        );
    }
}
