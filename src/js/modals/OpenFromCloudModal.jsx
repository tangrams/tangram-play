import React from 'react';
import PropTypes from 'prop-types';
import SceneSelectModal from './SceneSelectModal';

import { load } from '../tangram-play';
import { fetchSceneList, deleteScene } from '../storage/mapzen';

function confirmHandler(selected) {
  if (!selected) return;

  load({
    url: this.state.selected.entrypoint_url,
    data: this.state.selected,
    source: 'MAPZEN',
  });
}

export default function OpenFromCloudModal(props) {
  return (
    <SceneSelectModal
      modalId={props.modalId}
      title="Open a saved scene from your Mapzen account"
      emptyListMessage="No scenes have been saved!"
      sceneLoader={fetchSceneList}
      confirmHandler={confirmHandler}
      deleteHandler={deleteScene}
      allowDelete
    />
  );
}

OpenFromCloudModal.propTypes = {
  modalId: PropTypes.number.isRequired,
};
