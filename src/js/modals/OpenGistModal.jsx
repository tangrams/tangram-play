import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';

import Modal from './Modal';
import SceneItem from './SceneItem';
import Icon from '../components/Icon';
import { showErrorModal } from './ErrorModal';
import { load } from '../tangram-play';
import { getSceneURLFromGistAPI } from '../tools/gist-url';
import { getGists, removeNonexistentGistFromLocalStorage } from '../storage/gist';

class OpenGistModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      gists: [],
      selected: null,
    };

    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
  }

  componentWillMount() {
    // Always load new set of saved Gists from memory each time this modal is
    // opened, in case it has changed during use
    getGists().then((gists = []) => {
      this.setState({
        loaded: true,
        gists,
      });
    });
  }

  onClickCancel() {
    this.props.dispatch({
      type: 'HIDE_MODAL',
      id: this.props.modalId,
    });
  }

  onClickConfirm() {
    if (this.state.selected) {
      this.onClickCancel(); // to close modal

      getSceneURLFromGistAPI(this.state.selected.url)
        .then((url) => {
          load({
            url,
            data: this.state.selected,
            source: 'GIST',
          });
        })
        .catch((error) => {
          this.handleError(error, this.state.selected.url);
        });
    }
  }

  /**
   * If opening a URL is not successful
   *
   * @param {Error} error - thrown by something else
   *    if error.message is a number, then it is a status code from Fetch
   *    but status code numbers are converted to strings
   *    there must be a better way of doing this
   * @param {string} url - the Gist URL that was attempted
   */
  handleError(error, value) {
    // Close the modal, if still present
    if (this.component) {
      this.onClickCancel();
    }

    let message = '';

    if (error.message === '404') {
      message = 'This Gist could not be found.';
    } else if (error.message === '403') {
      message = 'We exceeded the rate limit for GitHub’s non-authenticated request API.';
    } else if (Number.isInteger(window.parseInt(error.message, 10))) {
      message = `The Gist server gave us an error code of ${error.message}`;
    }

    showErrorModal(`Could not load the Gist! ${message}`);

    if (error.message === '404') {
      removeNonexistentGistFromLocalStorage(value);
    }
  }

  render() {
    const gists = this.state.gists;

    let sceneList;

    if (this.state.loaded === true && gists.length === 0) {
      sceneList = 'No gists have been saved!';
    } else {
      sceneList = gists.map((item, index) => {
        let classString = '';

        if (this.state.selected && this.state.selected.url === item.url) {
          classString = 'open-scene-selected';
        }

        return (
          <div
            className={classString}
            role="menuitem"
            tabIndex={0}
            key={item.url}
            data-url={item.url}
            onFocus={(e) => { this.setState({ selected: item }); }}
            onClick={() => { this.setState({ selected: item }); }}
            onDoubleClick={this.onClickConfirm}
          >
            <SceneItem
              thumbnail={item.thumbnail}
              name={item.name}
              description={item.description}
              date={item.created_at}
            />
          </div>
        );
      });
    }

    // Render the entire modal
    return (
      <Modal
        className="modal-alt open-scene-modal"
        ref={(ref) => { this.component = ref; }}
        cancelFunction={this.onClickCancel}
        confirmFunction={this.onClickConfirm}
      >
        <h4>Open a previously saved Gist</h4>

        <div className="modal-content modal-well open-scene-list">
          {sceneList}
        </div>

        <div className="modal-buttons">
          <Button onClick={this.onClickCancel} className="button-cancel">
            <Icon type="bt-times" /> Cancel
          </Button>
          <Button
            onClick={this.onClickConfirm}
            className="button-confirm"
            disabled={this.state.selected === null}
          >
            <Icon type="bt-check" /> Open
          </Button>
        </div>
      </Modal>
    );
  }
}

OpenGistModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalId: PropTypes.number.isRequired,
};

export default connect()(OpenGistModal);
