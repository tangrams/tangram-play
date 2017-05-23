import React from 'react';
import PropTypes from 'prop-types';
import SceneSelectModal from './SceneSelectModal';

import { load } from '../tangram-play';
import EXAMPLES_DATA from './examples.json';

function confirmHandler(selected) {
  if (!selected) return;

  load({
    url: selected.url,
    data: selected,
    source: 'EXAMPLES',
  });
}

export default function ExamplesModal(props) {
  return (
    <SceneSelectModal
      modalId={props.modalId}
      title="Choose an example to open"
      scenes={EXAMPLES_DATA[0].scenes}
      confirmHandler={confirmHandler}
    />
  );
}

ExamplesModal.propTypes = {
  modalId: PropTypes.number.isRequired,
};
