import React from 'react';
import { connect } from 'react-redux';

// Redux
import { SET_APP_STATE } from '../store/actions';

class EditorHiddenTooltip extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      display: false,
      dismissed: false,
    };

    this.onMouseDownToDismiss = this.onMouseDownToDismiss.bind(this);
  }

  componentWillMount() {
    let display = false;
    // TODO: don't hardcode hidden position check
    if (this.props.dividerPositionX >= window.innerWidth - 10) {
      display = true;
    } else if (this.props.showEditorHiddenTooltip === true) {
      display = true;
    }

    this.setState({ display });
  }

  componentWillReceiveProps(nextProps) {
    // TODO: don't hardcode hidden position check
    const editorIsVisuallyCollapsed = nextProps.dividerPositionX >= window.innerWidth - 10;
    const collapsedStateIsNew = this.props.dividerPositionX !== nextProps.dividerPositionX;

    // Show when specifically requested, or if the editor is collapsed by hand
    if ((nextProps.showEditorHiddenTooltip === true && editorIsVisuallyCollapsed) ||
      (editorIsVisuallyCollapsed && collapsedStateIsNew)) {
      this.setState({
        display: true,
        dismissed: false,
      });
    }
  }

  // Activate on mousedown rather than on click, because drag interactions do
  // not transform into click events sometimes, and interferes with display state.
  onMouseDownToDismiss(event) {
    // TODO: Animate out
    this.props.dispatch({
      type: SET_APP_STATE,
      showEditorHiddenTooltip: false,
    });
    this.setState({ dismissed: true });

    window.removeEventListener('mousedown', this.onMouseDownToDismiss);
  }

  render() {
    if (this.state.display === true && this.state.dismissed === false) {
      // Clicks dismiss the tooltip after some delay
      window.setTimeout(() => {
        window.addEventListener('mousedown', this.onMouseDownToDismiss);
      }, 0);

      return (
        <div className="editor-hidden-tooltip">
          <h5>The editor pane is hidden</h5>
          <p>Drag this divider handle to bring it back!</p>
        </div>
      );
    }

    return null;
  }
}

EditorHiddenTooltip.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  dividerPositionX: React.PropTypes.number,
  showEditorHiddenTooltip: React.PropTypes.bool,
};

EditorHiddenTooltip.defaultProps = {
  dividerPositionX: 0,
  showEditorHiddenTooltip: false,
};

function mapStateToProps(state) {
  return {
    dividerPositionX: state.settings.dividerPositionX,
    showEditorHiddenTooltip: state.app.showEditorHiddenTooltip,
  };
}

export default connect(mapStateToProps)(EditorHiddenTooltip);
