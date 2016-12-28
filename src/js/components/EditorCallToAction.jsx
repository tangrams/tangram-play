import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import ExamplesModal from '../modals/ExamplesModal';

class EditorCallToAction extends React.PureComponent {
  // eslint-disable-next-line class-methods-use-this
  onClickExample() {
    ReactDOM.render(<ExamplesModal />, document.getElementById('modal-container'));
  }

  render() {
    // Don't flash this when Tangram Play is initializing;
    // files are still zero, but we won't prompt until after
    if (this.props.appInitialized === false) return null;

    // Return nothing if editor contains files
    if (this.props.files.length > 0) return null;

    return (
      <div className="editor-no-content">
        <div className="call-to-action modal-well">
          <h2>Nothing is loaded in Tangram Play.</h2>

          <button onClick={this.onClickExample}>Choose an example scene</button>

          {/* Other ideas //
          <h3>Some of your recent scenes</h3>

          <ul>
              <li>Like this one</li>
              <li>Or this one</li>
          </ul>

          <p>
              Or drag and drop a scene file from your computer onto this window!
          </p>
          */}
        </div>
      </div>
    );
  }
}

EditorCallToAction.propTypes = {
  appInitialized: React.PropTypes.bool,
  files: React.PropTypes.arrayOf(React.PropTypes.object),
};

EditorCallToAction.defaultProps = {
  appInitialized: false,
  files: [],
};

function mapStateToProps(state) {
  return {
    appInitialized: state.app.initialized,
    files: state.scene.files,
  };
}

export default connect(mapStateToProps)(EditorCallToAction);
