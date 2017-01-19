import React from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

import { load } from '../tangram-play';

let lastAttemptedUrlInput;

class OpenUrlModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      thinking: false,
      input: lastAttemptedUrlInput || '',
    };

    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.unmountSelf = this.unmountSelf.bind(this);
  }

  componentDidMount() {
    this.input.select();
    this.input.focus();
  }

  onClickConfirm() {
    // Bail if no input
    if (!this.state.input) return;

    // Waiting state
    this.setState({
      thinking: true,
    });

    // Cache this
    lastAttemptedUrlInput = this.state.input;

    // We no longer check for valid URL signatures.
    // It is easier to attempt to fetch an input URL and see what happens.
    const url = this.state.input.trim();
    load({ url })
      .then(this.unmountSelf);
  }

  onClickCancel(event) {
    this.unmountSelf();
  }

  onChangeInput(event) {
    this.setState({ input: event.target.value });
  }

  unmountSelf() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      key: this.props.modalId,
    });
  }

  render() {
    return (
      <Modal
        className="modal-alt open-url-modal"
        disableEsc={this.state.thinking}
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <h4>Open a scene file from URL</h4>

        <div className="modal-content open-url-input">
          <input
            type="text"
            id="open-url-input"
            placeholder="https://"
            spellCheck="false"
            value={this.state.input}
            ref={(ref) => { this.input = ref; }}
            onChange={this.onChangeInput}
          />
        </div>

        <div className="modal-buttons">
          <LoadingSpinner on={this.state.thinking} />
          <Button
            className="button-cancel"
            disabled={this.state.thinking}
            onClick={this.onClickCancel}
          >
            <Icon type="bt-times" /> Cancel
          </Button>
          <Button
            className="button-confirm"
            disabled={Boolean(!this.state.input) || this.state.thinking}
            onClick={this.onClickConfirm}
          >
            <Icon type="bt-check" /> Open
          </Button>
        </div>
      </Modal>
    );
  }
}

OpenUrlModal.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  modalId: React.PropTypes.number,
};

export default connect()(OpenUrlModal);
