import React from 'react';
import FloatingPanel from '../FloatingPanel';
import ColorPicker from './widgets/color/ColorPicker';

import { EventEmitter } from './event-emitter';
import Color from './widgets/color/color';

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

        for (let i = 0; i < colors.length; i++) {
            if (colors[i].color.getRgbaString() === data.getRgbaString()) {
                colors[i].count = colors[i].count + 1;

                this.setState({ colors: colors });
                // console.log('\n\nNew color');
                // this.printPalette(colors);

                return;
            }
        }

        let newColor = {
            color: data,
            count: 1
        };

        colors.push(newColor);
        this.setState({ colors: colors });

        // console.log('\n\nNew color');
        // this.printPalette(colors);
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

        // console.log('\n\nremoving color');
        // this.printPalette(colors);
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
     * @param newColor - color that user has chosen in the color picker widget. Object of type Color
     */
    onChange (newColor) {
        // Step 1: Set the color picker to whatever new color the user has picked
        const oldC = this.state.currentColor;
        const newC = {
            color: newColor,
            count: oldC.count
        };
        this.setState({ currentColor: newC });
        // console.log("current color: " + oldC.color.getHexString());

        // Step 2: Then update the current color array with the new color
        let newColorArray = this.state.colors;
        newColorArray[this.state.currentPosition] = newC;
        this.setState({ colors: newColorArray });

        // Step 3: Alert each individual widget to that a color has changed
        // Each widget will have to check if the change applies to itself
        EventEmitter.dispatch('color-palette:color-change', { old: oldC.color, new: newC.color });
        // console.log('\nCOLOR CHANGE\n');
        // this.printPalette(newColorArray);
    }

    /**
     * Resets the color picker when a new scene has loaded
     */
    clearColors () {
        this.setState({ colors: [] });
    }


    /* For the moment, keeping this for debugging what's in the color palette */
    printPalette (array) {
        for (let color of array) {
            console.log('Color: ' + color.color.getHexString() + ' count: ' + color.count);
        }
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
                colors.push(<div key={i} className='colorpalette-color' onClick={ this.onClick.bind(null, color, i) }><div className='colorpalette-square' style={widgetStyle}></div></div>);
            }
        }

        return (
            <div>
                {/* List of colors in the palette */}
                <div>{ colors }</div>

                {/* Floating panel */}
                <FloatingPanel
                    x={this.x}
                    y={this.y}
                    width={this.width}
                    height={this.height}
                    show={this.state.displayPicker}
                    onHide={this.onHide}
                >
                    <ColorPicker
                        className={'colorpicker'}
                        color={ this.state.currentColor.color.getRgba() }
                        onChange={ this.onChange }
                    />
                </FloatingPanel>
            </div>
        );
    }
}
