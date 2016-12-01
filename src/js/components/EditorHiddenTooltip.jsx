import React from 'react';
import { connect } from 'react-redux';

class EditorHiddenTooltip extends React.PureComponent {
  render() {
    if (this.props.dividerPositionX >= window.innerWidth - 10) {
      return (
        <div className="editor-hidden-tooltip">
          <h5>You’ve hidden the editor pane</h5>
          <p>Drag this divider handle to bring it back!</p>
        </div>
      );
    }

    return null;
  }
}

EditorHiddenTooltip.propTypes = {
  dividerPositionX: React.PropTypes.number,
};

function mapStateToProps(state) {
  return {
    dividerPositionX: state.settings.dividerPositionX,
  };
}

export default connect(mapStateToProps)(EditorHiddenTooltip);
