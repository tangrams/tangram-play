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
            currentColor: {
                color: new Color('white'),
                count: 1
            },
            currentPosition: 0,
            displayPicker: false,
            x: 0,
            y: 0
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addNewColor = this.addNewColor.bind(this);
        this.changeColor = this.changeColor.bind(this);
        this.removeColor = this.removeColor.bind(this);
        this.clearColors = this.clearColors.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * Temporary requirement is to subscribe to events from map becuase it is
     * not a React component
     */
    componentDidMount () {
        EventEmitter.subscribe('widgets:color', data => { this.addNewColor(data); });
        EventEmitter.subscribe('widgets:color-unmount', data => { this.removeColor(data); });
        EventEmitter.subscribe('widgets:color-change', data => { this.changeColor(data); });
        EventEmitter.subscribe('tangram:clear-palette', this.clearColors);
    }

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

    changeColor (data) {
        this.removeColor(data.old);
        this.addNewColor(data.new);
    }

    handleClick (color, i, e) {
        // Set the x and y of the modal that will contain the widget
        let el = document.getElementsByClassName('workspace-container')[0];
        let screenHeight = el.clientHeight;
        let screenWidth = el.clientWidth;
        // An approximation of x based on size of widget and place within array
        let myX = (this.state.colors.length - i) * 22 + 250;
        this.setState({ x: (screenWidth - myX) });
        this.setState({ y: (screenHeight - 394) });

        // Log the currentColor being edited + the position of the color within our internal color array
        this.setState({ currentColor: color });
        this.setState({ currentPosition: i });

        this.setState({ displayPicker: !this.state.displayPicker });
    }

    handleHide () {
        this.setState({ displayPicker: !this.state.displayPicker });
    }

    handleChange (color) {
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

                colors.push(<div key={i} className='palette-color' onClick={ this.handleClick.bind(null, color, i) }><div className='square' style={widgetStyle}></div></div>);
            }
        }

        return (
            <div>
                <div className='colors'>
                    { colors }
                </div>
                {/* Draggable modal */}
                <Modal id='modal-test' dialogComponentClass={DraggableModal} x={this.state.x} y={this.state.y} enforceFocus={false} className='widget-modal' show={this.state.displayPicker} onHide={this.handleHide}>
                    <div className='drag'>
                        <Button onClick={ this.handleHide } className='widget-exit'><Icon type={'bt-times'} /></Button>
                    </div>
                    {/* The actual color picker */}
                    <WidgetColorBox className={'widget-color-picker'} color={ this.state.currentColor.color.getRgba() } onChange={ this.handleChange }/>
                </Modal>
            </div>
        );
    }
}
