import L from 'leaflet';
import CodeMirror from 'codemirror';
import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import VERSION from '../version.json';

import Modal from './Modal';

class AboutModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onClickClose = this.onClickClose.bind(this);
  }

  onClickClose() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  render() {
    return (
      <Modal
        className="about-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text modal-about-text">
          <h4>About Tangram Play</h4>

          <p>
            Tangram Play (beta) v{VERSION.v}
          </p>

          <p>
            {/* Get and display version numbers.
                Tangram version comes with its own "v" */}
            Tangram <span className="about-tangram-version">{window.Tangram.version}</span>
            {/* Add "v" for Leaflet and CodeMirror */}
            <br />Leaflet <span className="about-leaflet-version">{`v${L.version}`}</span>
            <br />CodeMirror <span className="about-cm-version">{`v${CodeMirror.version}`}</span>
          </p>
          <p>
            Made with 💖 by <a href="https://mapzen.com/" target="_blank" rel="noopener noreferrer">Mapzen</a>.
          </p>
          <p>
            <a href="https://github.com/tangrams/tangram-play" target="_blank" rel="noopener noreferrer">View source on GitHub</a>
          </p>
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickClose} className="button-confirm">Got it</Button>
        </div>
      </Modal>
    );
  }
}

AboutModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
};

export default connect()(AboutModal);
