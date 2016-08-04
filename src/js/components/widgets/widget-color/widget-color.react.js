import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../../draggable-modal.react';
import Icon from '../../Icon';
import WidgetColorBox from './widget-color-box.react';

import { setCodeMirrorValue } from '../../../editor/editor';
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
            color: new Color(this.props.value),
            x: 0,
            y: 0
        };
        this.bookmark = this.props.bookmark;
        this.mounted = true;

        // Need to know width in case a widget is about to get rendered outside of the normal screen size
        // TODO: Don't hardcode this.
        this.height = 300;
        this.width = 250;

        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onPaletteChange = this.onPaletteChange.bind(this);

        // console.log("new color picker");
    }

    /**
     * React lifecycle function. Gets called once when DIV is mounted
     */
    componentDidMount () {
        // Only pass on colors that are valid. i.e. as the user types the color widget is white by default but
        // the widget does not representa  fully valid color
        if (this.state.color.valid) {
            EventEmitter.dispatch('widgets:color', this.state.color);
        }

        EventEmitter.subscribe('color-palette:color-change', data => { this.onPaletteChange(data); });
    }

    componentWillUnmount () {
        this.mounted = false;

        EventEmitter.dispatch('widgets:color-unmount', this.state.color);
        // console.log('UNMOUNTING' + this.state.color.getHexString());

        // Do nothing on color palette changes if the React component has been unmounted.
        // This is to prevent following error: 'Can only update a mounted or mounting component. This usually means you called setState() on an unmounted component.'
        // EventEmitter.subscribe('color-palette:color-change', data => {});
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
     * @param newColor - color that user has chosen in the color picker widget. Object of type Color
     */
    onChange (newColor) {
        if (this.mounted) {
            const oldColor = this.state.color;

            this.setState({ color: newColor });
            this.setEditorValue(newColor.getVecString());

            EventEmitter.dispatch('widgets:color-change', { old: oldColor, new: newColor });
        }
    }

    /**
     * Every time a user changes a color on the color palette, all color widgets
     * need to check whether that change applies to their own internal color
     *
     * @param data - the new color the user has chosen
     */
    onPaletteChange (data) {
        if (this.mounted) {
            if (data.old.getRgbaString() === this.state.color.getRgbaString()) {
                // console.log(data);
                this.setState({ color: data.new });
                this.setEditorValue(data.new.getVecString());
            }
        }
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
        if (this.mounted) {
            let widgetStyle = { backgroundColor: this.state.color.getRgbaString() };

            return (
                <div>
                    {/* The widget button user clicks to open color picker */}
                    <div className='widget widget-colorpicker' onClick={ this.onClick } style={widgetStyle}></div>

                    {/* Draggable modal */}
                    <Modal dialogComponentClass={DraggableModal} x={this.state.x} y={this.state.y} enforceFocus={false} className='widget-modal' show={this.state.displayColorPicker} onHide={this.onClick}>
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
}

/**
 * Prop validation required by React
 */
WidgetColor.propTypes = {
    bookmark: React.PropTypes.object,
    value: React.PropTypes.string
};
