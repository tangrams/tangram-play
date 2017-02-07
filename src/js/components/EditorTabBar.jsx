import { noop } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import EditorTabs from './EditorTabs';
import IconButton from './IconButton';
import { setDividerPosition } from './Divider';
import { SET_APP_STATE } from '../store/actions';

class EditorTabBar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onClickHideEditor = this.onClickHideEditor.bind(this);
  }

  /**
   * Hides the editor pane.
   * There is no special "flag" for hidden; it requests the Divider component
   * to update its position to the full window width (as far right as possible).
   * The Divider component will take care of the rest.
   */
  onClickHideEditor(event) {
    setDividerPosition(window.innerWidth);
    this.props.showEditorHiddenTooltip();
  }

  render() {
    // Disable tabs in embedded mode.
    // See request https://github.com/tangrams/tangram-play/issues/620
    // Rather than expose Yet Another Embed Option, there's a product answer
    // to this: there's no real need for tabs in embedded mode (at least not
    // yet) so let's remove this functionality from embedded.
    if (this.props.disabled) {
      return null;
    }

    return (
      <div className="editor-tab-bar">
        <EditorTabs />
        <IconButton
          className="editor-collapse-button"
          icon="bt-caret-right"
          tooltip="Hide editor"
          onClick={this.onClickHideEditor}
        />
      </div>
    );
  }
}

EditorTabBar.propTypes = {
  // Injected by `mapStateToProps`
  disabled: React.PropTypes.bool,

  // Injected by `mapDispatchToProps`
  showEditorHiddenTooltip: React.PropTypes.func.isRequired,
};

EditorTabBar.defaultProps = {
  disabled: false,
  showEditorHiddenTooltip: noop,
};

function mapStateToProps(state) {
  return {
    disabled: !state.app.showEditorTabBar,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showEditorHiddenTooltip: () => {
      dispatch({
        type: SET_APP_STATE,
        showEditorHiddenTooltip: true,
      });
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorTabBar);
