import React from 'react';
import Draggable from 'react-draggable';

import { throttle } from 'lodash';
import { map } from '../map/map';
import { editor } from '../editor/editor';
import EventEmitter from './event-emitter';

// Redux
import store from '../store';
import { SET_SETTINGS } from '../store/actions';

const EDITOR_MINIMUM_WIDTH = 160; // integer, in pixels
const MAP_MINIMUM_WIDTH = 130; // integer, in pixels

/**
 * Clamps the position to a value to make sure that the map and editor are
 * never below their minimum widths. This is important to check when
 * viewport may change (e.g. the user resizes it)
 *
 * @param {Number} x - the current position of the divider
 * @returns {Number} x - the clamped, if needed, position to place the divider.
 */
function clampPosition(x) {
    const min = MAP_MINIMUM_WIDTH;
    const max = window.innerWidth - EDITOR_MINIMUM_WIDTH;
    return Math.min(Math.max(x, min), max);
}

/**
 * Retrieves the starting position of the divider: a number value, in pixels,
 * that the divider element's left edge should be offset from the left edge
 * of the viewport.
 *
 * Restore it from memory, if saved from a previous session.
 * Otherwise, put it at a default position based on current viewport width.
 *
 * @returns {Number} x - the position to place the divider.
 */
function getStartingPosition() {
    const settings = store.getState().settings;

    if (settings && settings.dividerPositionX) {
        // Clamp the number to the permitted range, because viewport sizes
        // may differ between sessions
        return clampPosition(settings.dividerPositionX);
    }

    if (window.innerWidth > 1024) {
        return Math.floor(window.innerWidth * 0.6);
    }

    // If window.innerWidth <= 1024
    return Math.floor(window.innerWidth / 2);
}

export default class Divider extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            startPosX: getStartingPosition(),
            position: { // We need this to sync position state manually
                x: 0,
                y: 0,
            },
        };

        this.throttledRefresh = throttle(this.refreshMapAndEditor, 20);
        this.onResizeWindow = this.onResizeWindow.bind(this);
        this.changeMapAndEditorSize = this.changeMapAndEditorSize.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.onStop = this.onStop.bind(this);
    }

    // We need to begin with an initial value to set the absolute
    // starting position of the divider, which is either a saved location
    // in user's LocalStorage or a default value based on screen width.
    // Draggable does not set initial positions for us, so we are
    // responsible for this here. Starting position is an asynchronous
    // function (because it reads from localforage) so it is retrieved and
    // set on state.
    componentDidMount() {
        // Cache element references for map and editor
        this.mapEl = document.getElementById('map-container');
        this.contentEl = document.getElementById('content');

        window.addEventListener('resize', this.onResizeWindow);

        // Set up initial positioning
        this.changeMapAndEditorSize(this.state.startPosX);
    }

    onDrag(event, position) {
        const posX = this.contentEl.getBoundingClientRect().left;
        this.changeMapAndEditorSize(clampPosition(posX + position.x));
        EventEmitter.dispatch('divider:drag');
    }

    onStop(event, position) {
        const posX = position.node.getBoundingClientRect().left;

        // React-draggable internally manages its state if the `position` prop
        // is not provided. Using a combination of JavaScript and CSS we can
        // lock the minimum and maximum positions of the divider, BUT internally
        // react-draggable does not know that. So we must manually reset the
        // `position` to 0 so that it does not store a delta internally. If
        // it were allowed to store a delta, a user would be dragging a "phantom"
        // divider back to its bounded location before any interaction is
        // possible.
        this.setState({
            position: {
                x: 0,
                y: 0,
            },
        });

        // Save the position in Redux
        store.dispatch({
            type: SET_SETTINGS,
            dividerPositionX: posX,
        });

        EventEmitter.dispatch('divider:dragend');
    }

    onResizeWindow() {
        // Window size has changed; update position
        const currentXPos = this.contentEl.getBoundingClientRect().left;
        const clampedXPos = clampPosition(currentXPos);
        this.changeMapAndEditorSize(clampedXPos);
    }

    /**
     * This directly adjusts the map and editor content elements.
     * Not very React-friendly, but is quite fast.
     * TODO: Explore optimal ways to replace this.
     */
    changeMapAndEditorSize(positionX) {
        this.mapEl.style.width = `${positionX}px`;
        this.contentEl.style.width = `${window.innerWidth - positionX}px`;

        this.throttledRefresh();
    }

    /**
     * Refreshes CodeMirror and Leaflet to respond to different element sizes
     * during or after a divider drag. This may be expensive so it is
     * throttled and aliased as `this.throttledRefresh()`.
     */
    refreshMapAndEditor() {
        if (editor) {
            editor.refresh();
        }

        // Also refresh the map
        map.invalidateSize({
            pan: {
                animate: false,
            },
            zoom: {
                animate: false,
            },
            debounceMoveend: true,
        });
    }

    render() {
        return (
            <Draggable
                axis="x"
                position={this.state.position}
                defaultClassNameDragging="divider-is-dragging"
                onDrag={this.onDrag}
                onStop={this.onStop}
            >
                <div
                    className="divider"
                    ref={(ref) => { this.dividerEl = ref; }}
                >
                    <span className="divider-affordance" />
                </div>
            </Draggable>
        );
    }
}
