/**
 * EditorPane
 *
 * This is a parent container component for the editor. It handles position and size.
 * The <Divider> component is included here as a draggable handle to resize
 * the pane. Logic that affects editor content itself (e.g. files) reside in
 * the child <Editor> component.
 */
import React from 'react';
import { connect } from 'react-redux';
import EventEmitter from './event-emitter';
import Editor from './Editor';
import Divider from './Divider';
import EditorHiddenTooltip from './EditorHiddenTooltip';

class EditorPane extends React.PureComponent {
  constructor(props) {
    super(props);

    this.animating = false;

    this.updateEditorWidth = this.updateEditorWidth.bind(this);
  }

  componentDidMount() {
    // Initially set the editor width based on Redux state. This is because
    // this component mounts before Divider is ready to send events.
    this.updateEditorWidth({ posX: this.props.dividerPositionX });
    EventEmitter.subscribe('divider:reposition', this.updateEditorWidth);
  }

  componentDidUpdate(prevProps, prevState) {
    // Handle divider position changes
    if (this.props.dividerPositionX !== prevProps.dividerPositionX) {
      this.updateEditorWidth({ posX: this.props.dividerPositionX });
    }
  }

  /**
   * Sets editor pane width.
   * This is called in response to the `divider:reposition` event which
   * passes an event object containing the left edge of the divider element.
   * It can also be called manually (see `componentDidMount()`) as long as
   * the `event` object matches the signature.
   */
  updateEditorWidth(event) {
    // Early return if `this.el` is `null`, which happens when this function
    // is called from listening for `divider:reposition` while the component
    // is still updating, so the DOM node has not appeared as a ref.
    if (!this.el) return;

    this.el.style.width = `${window.innerWidth - event.posX}px`;
  }

  render() {
    return (
      <div className="editor-pane" ref={(ref) => { this.el = ref; }}>
        <Divider />
        <EditorHiddenTooltip />
        <Editor />
      </div>
    );
  }
}

EditorPane.propTypes = {
  dividerPositionX: React.PropTypes.number,
};

EditorPane.defaultProps = {
  dividerPositionX: 0,
};

function mapStateToProps(state) {
  return {
    dividerPositionX: state.persistence.dividerPositionX,
  };
}

export default connect(mapStateToProps)(EditorPane);
