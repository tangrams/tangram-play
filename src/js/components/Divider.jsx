import React from 'react';
import Draggable from 'react-draggable';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';

// Redux
import store from '../store';
import { SET_SETTINGS } from '../store/actions';

// Constraints
// A small `EDITOR_MINIMUM_WIDTH` allows it to be minimized but preserve enough
// space for the divider to still exist.
const EDITOR_MINIMUM_WIDTH = 10; // integer, in pixels
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
  if (window.innerWidth > 1024) {
    return Math.floor(window.innerWidth * 0.6);
  }

  // If window.innerWidth <= 1024
  return Math.floor(window.innerWidth / 2);
}

/**
 * Announces divider position to other components via EventEmitter.
 * Other components (Map and Editor) subscribe to this event so they can
 * resize themselves and respond accordingly.
 * This is much faster and less jankier than passing divider position
 * as Redux state and re-rendering components as it updates, especially
 * during the drag action.
 *
 * @params {Number} posX - the current X position, from left edge of window,
 *      of the divider element.
 */
function broadcastDividerPosition(posX) {
  EventEmitter.dispatch('divider:reposition', { posX });
}

class Divider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // We need this to sync position state manually
      position: { x: 0, y: 0 },
    };

    this.onResizeWindow = this.onResizeWindow.bind(this);
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
    window.addEventListener('resize', this.onResizeWindow);
    broadcastDividerPosition(this.props.posX);
  }

  // Only update if the position changes - this prevents layout flashing
  // occurring when props.posX differs from the dragged position.
  shouldComponentUpdate(nextProps) {
    return this.props.posX !== nextProps.posX;
  }

  // Called when something updates props (e.g. new divider position.)
  componentWillUpdate(nextProps) {
    broadcastDividerPosition(nextProps.posX);
  }

  onDrag(event, position) {
    const currentPosX = position.node.getBoundingClientRect().left;
    const clampedPosX = clampPosition(currentPosX + position.x);
    broadcastDividerPosition(clampedPosX);
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
      position: { x: 0, y: 0 },
    });

    // Save the position in Redux
    store.dispatch({
      type: SET_SETTINGS,
      dividerPositionX: posX,
    });
  }

  // Window size has changed; update position
  onResizeWindow() {
    const currentPosX = this.dividerEl.getBoundingClientRect().left;
    const clampedPosX = clampPosition(currentPosX);
    broadcastDividerPosition(clampedPosX);
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

Divider.propTypes = {
  posX: React.PropTypes.number,
};

Divider.defaultProps = {
  posX: getStartingPosition(),
};

function mapStateToProps(state) {
  return {
    // Make sure position is clamped before feeding into props
    posX: clampPosition(state.settings.dividerPositionX),
  };
}

export default connect(mapStateToProps)(Divider);
