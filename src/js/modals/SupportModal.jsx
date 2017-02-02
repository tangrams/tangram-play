import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';

class SupportModal extends React.PureComponent {
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
        className="support-modal"
        cancelFunction={this.onClickClose}
      >
        <div className="modal-text">
          <h4>Tangram Play Support</h4>

          <p>
            Learn more about using <a href="https://mapzen.com/documentation/tangram" target="_blank" rel="noopener noreferrer">Tangram</a> and <a href="https://mapzen.com/documentation/vector-tiles/" target="_blank" rel="noopener noreferrer">Mapzen vector tiles</a> on their documentation pages.
          </p>

          <p>
            Having a problem with Tangram Play? Do you have feedback to share? Contact Mapzen Support by emailing <a href="mailto:tangram@mapzen.com">tangram@mapzen.com</a>.
          </p>

          <p>
            Tangram Play is still in active development and you can have a role in it! Add bugs or feature requests as an issue on the project’s <a href="https://github.com/tangrams/tangram-play/issues" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
          </p>
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickClose} className="button-confirm">Got it</Button>
        </div>
      </Modal>
    );
  }
}

SupportModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number.isRequired,
};

export default connect()(SupportModal);
