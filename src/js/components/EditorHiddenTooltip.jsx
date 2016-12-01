import React from 'react';
import { connect } from 'react-redux';

// Redux
import { SET_APP_STATE } from '../store/actions';

class EditorHiddenTooltip extends React.Component {
  constructor(props) {
    super(props);

    this.state = { display: false };

    this.onClickToDismiss = this.onClickToDismiss.bind(this);
  }

  componentWillMount() {
    let display = false;
    if (this.props.dividerPositionX >= window.innerWidth - 10) {
      display = true;
    } else if (this.props.showEditorHiddenTooltip === true) {
      display = true;
    }

    this.setState({ display });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.dividerPositionX >= window.innerWidth - 10
      || nextProps.showEditorHiddenTooltip === true) {
      this.setState({ display: true });
    } else {
      this.setState({ display: false });
    }
  }

  onClickToDismiss(event) {
    this.props.dispatch({
      type: SET_APP_STATE,
      showEditorHiddenTooltip: false,
    });

    window.removeEventListener('click', this.onClickToDismiss);
  }

  render() {
    if (this.state.display === true) {
      // Clicks dismiss the tooltip after some delay
      window.setTimeout(() => {
        window.addEventListener('click', this.onClickToDismiss);
      }, 500);

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
  dispatch: React.PropTypes.func,
  dividerPositionX: React.PropTypes.number,
  showEditorHiddenTooltip: React.PropTypes.bool,
};

function mapStateToProps(state) {
  return {
    dividerPositionX: state.settings.dividerPositionX,
    showEditorHiddenTooltip: state.app.showEditorHiddenTooltip,
  };
}

export default connect(mapStateToProps)(EditorHiddenTooltip);
