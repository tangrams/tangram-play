import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import DraggableModal from './DraggableModal';

export default class FloatingPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      x: this.props.x,
      y: this.props.y,
    };

    this.recalculatePosition = this.recalculatePosition.bind(this);
  }

  componentWillMount() {
    // Set the state with the results of the recalculated position
    this.setState(this.recalculatePosition(this.state));
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.recalculatePosition(nextProps));
  }

  /**
   * The panel is provided, via props, an `x`, `y`, `width` and `height`
   * values. `x` and `y` are the positions to display the upper left corner
   * of the panel. However, we want to make sure that the panel does not
   * appear outside of the viewport. This function takes into account the
   * panels' `width` and `height` values and ensures that `x` and `y` is
   * recalculated to keep the panel inside the viewport.
   *
   * @param {Object} state - object containing properties `x` and `y`
   *          (e.g. from `state` or `props`)
   * @returns {Object} - object containing properties `x` and `y` that should
   *          be passed to `setState()`
   */
  recalculatePosition(state) {
    // Magic number: a vertical distance in pixels to offset from the
    // provided Y value to give it a little bit of breathing room.
    const VERTICAL_POSITION_BUFFER = 5;

    // TODO: don't hardcode this bounding element.
    const workspaceEl = document.getElementsByClassName('workspace-container')[0];
    const workspaceBounds = workspaceEl.getBoundingClientRect();

    const width = this.props.width;
    const height = this.props.height;

    // Read position from current state
    let posX = state.x;
    let posY = state.y + VERTICAL_POSITION_BUFFER;

    // Prevent positions from going negative
    posX = Math.max(posX, workspaceBounds.left);
    posY = Math.max(posY, workspaceBounds.top);

    // Calculate maximum position values
    const maxX = posX + width;
    const maxY = posY + height;

    // Check if the widget would render outside of the workspace container area
    if (maxX > workspaceBounds.width) {
      posX = workspaceBounds.width - width;
    }
    if (maxY > workspaceBounds.height) {
      posY = workspaceBounds.height - height;
    }

    return {
      x: posX,
      y: posY,
    };
  }

  render() {
    return (
      <Modal
        dialogComponentClass={DraggableModal}
        className="widget-modal"
        enforceFocus={false}
        show={this.props.show}
        onHide={this.props.onClickClose}
        x={this.state.x}
        y={this.state.y}
      >
        <div className="floating-panel-topbar">
          <div className="floating-panel-drag">{this.props.title}</div>
          <button className="floating-panel-close" onClick={this.props.onClickClose}>×</button>
        </div>
        {this.props.children}
      </Modal>
    );
  }
}

FloatingPanel.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  width: React.PropTypes.number.isRequired,
  show: React.PropTypes.bool.isRequired,
  onClickClose: React.PropTypes.func,
  children: React.PropTypes.node.isRequired,
  title: React.PropTypes.string.isRequired,
};

FloatingPanel.defaultProps = {
  onClickClose: function noop() {},
  title: '',
};
