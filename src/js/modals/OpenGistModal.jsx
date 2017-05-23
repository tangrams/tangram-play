import React from 'react';
import PropTypes from 'prop-types';
import SceneSelectModal from './SceneSelectModal';

import { showErrorModal } from './ErrorModal';
import { load } from '../tangram-play';
import { getSceneURLFromGistAPI } from '../tools/gist-url';
import { getGists, removeNonexistentGistFromLocalStorage } from '../storage/gist';

/**
 * If opening a URL is not successful
 *
 * @param {Error} error - thrown by something else
 *    if error.message is a number, then it is a status code from Fetch
 *    but status code numbers are converted to strings
 *    there must be a better way of doing this
 * @param {string} url - the Gist URL that was attempted
 */
function handleError(error, value) {
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

function confirmHandler(selected) {
  if (!selected) return;

  getSceneURLFromGistAPI(selected.url)
    .then((url) => {
      load({
        url,
        data: selected,
        source: 'GIST',
      });
    })
    .catch((error) => {
      handleError(error, selected.url);
    });
}

export default function OpenGistModal(props) {
  return (
    <SceneSelectModal
      modalId={props.modalId}
      title="Open a previously saved Gist"
      emptyListMessage="No gists have been saved!"
      sceneLoader={getGists}
      confirmHandler={confirmHandler}
    />
  );
}

OpenGistModal.propTypes = {
  modalId: PropTypes.number.isRequired,
};
