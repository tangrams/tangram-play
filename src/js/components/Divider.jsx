import React from 'react';
import Draggable from 'react-draggable';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';

// Redux
import store from '../store';
import { SET_PERSISTENCE } from '../store/actions';

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

/**
 * Sets the divider position in Redux store. Exported for other components
 * to use so that they do not need to maintain their own logic about clamping
 * position.
 *
 * @params {Number} posX - desired X position of divider.
 */
export function setDividerPosition(posX) {
  store.dispatch({
    type: SET_PERSISTENCE,
    dividerPositionX: clampPosition(posX),
  });
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
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
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
  componentDidUpdate(prevProps) {
    broadcastDividerPosition(this.props.posX);
  }

  // eslint-disable-next-line class-methods-use-this
  onDrag(event, position) {
    const currentPosX = position.node.getBoundingClientRect().left;
    const clampedPosX = clampPosition(currentPosX + position.x);
    broadcastDividerPosition(clampedPosX);
  }

  onStop(event, position) {
    const posX = position.node.getBoundingClientRect().left;
    setDividerPosition(posX);

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
  }

  onMouseOver(event) {
    // TODO: Figure out how to do a hover tooltip
    // this.props.dispatch({
    //   type: SET_APP_STATE,
    //   showEditorHiddenTooltip: true,
    // });
  }

  onMouseOut(event) {
    // this.props.dispatch({
    //   type: SET_APP_STATE,
    //   showEditorHiddenTooltip: false,
    // });
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
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
        >
          <span className="divider-affordance" />
        </div>
      </Draggable>
    );
  }
}

Divider.propTypes = {
  // dispatch: React.PropTypes.func.isRequired,
  posX: React.PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  return {
    // Make sure position is clamped before feeding into props
    posX: clampPosition(state.persistence.dividerPositionX),
  };
}

export default connect(mapStateToProps)(Divider);
