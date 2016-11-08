import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Modal from './Modal';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

import { load } from '../tangram-play';

let lastAttemptedUrlInput;

export default class OpenUrlModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      thinking: false,
      input: lastAttemptedUrlInput || '',
    };

    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.onKeyPressInput = this.onKeyPressInput.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.unmountSelf = this.unmountSelf.bind(this);
  }

  componentDidMount() {
    this.input.select();
    this.input.focus();
  }

  onClickConfirm() {
    // Waiting state
    this.setState({
      thinking: true,
    });

    // Cache this
    lastAttemptedUrlInput = this.state.input;

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

  onKeyPressInput(event) {
    // We no longer check for valid URL signatures.
    // It is easier to attempt to fetch an input URL and see what happens.
    if (this.state.input) {
      const key = event.keyCode || event.which;
      if (key === 13) {
        this.onClickConfirm();
      }
    }
  }

  unmountSelf() {
    if (this.component) {
      this.component.unmount();
    }
  }

  render() {
    return (
      <Modal
        className="modal-alt open-url-modal"
        disableEsc={this.state.thinking}
        ref={(ref) => { this.component = ref; }}
        cancelFunction={this.onClickCancel}
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
            onKeyPress={this.onKeyPressInput}
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
