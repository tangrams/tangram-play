import React from 'react';
import { connect } from 'react-redux';

// Import all modals here
import AboutModal from './AboutModal';
import ExamplesModal from './ExamplesModal';
import OpenFromCloudModal from './OpenFromCloudModal';
import OpenGistModal from './OpenGistModal'; // LEGACY.
import OpenUrlModal from './OpenUrlModal';
import SaveToCloudModal from './SaveToCloudModal';
import SaveGistModal from './SaveGistModal'; // LEGACY.

const MODAL_COMPONENTS = {
  ABOUT: AboutModal,
  OPEN_EXAMPLE: ExamplesModal,
  OPEN_FROM_CLOUD: OpenFromCloudModal,
  OPEN_GIST: OpenGistModal, // LEGACY.
  OPEN_URL: OpenUrlModal,
  SAVE_TO_CLOUD: SaveToCloudModal,
  SAVE_GIST: SaveGistModal, // LEGACY.
  /* other modals */
};

const ModalRoot = ({ modalType, modalProps }) => {
  if (!modalType) {
    return null;
  }

  const SpecificModal = MODAL_COMPONENTS[modalType];
  return <SpecificModal {...modalProps} />;
};

ModalRoot.propTypes = {
  modalType: React.PropTypes.string,
  modalProps: React.PropTypes.objectOf(React.PropTypes.any),
};

export default connect(
  state => state.modals
)(ModalRoot);
