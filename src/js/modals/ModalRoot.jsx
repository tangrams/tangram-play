import React from 'react';
import { connect } from 'react-redux';

// Import all modals here
import AboutModal from './AboutModal';
import ConfirmDialogModal from './ConfirmDialogModal';
import ErrorModal from './ErrorModal';
import ExamplesModal from './ExamplesModal';
import OpenFromCloudModal from './OpenFromCloudModal';
import OpenGistModal from './OpenGistModal'; // LEGACY.
import OpenUrlModal from './OpenUrlModal';
import SaveToCloudModal from './SaveToCloudModal';
import SaveToCloudSuccessModal from './SaveToCloudSuccessModal';
import SaveGistModal from './SaveGistModal'; // LEGACY.
import SaveGistSuccessModal from './SaveGistSuccessModal'; // LEGACY.

const MODAL_COMPONENTS = {
  ABOUT: AboutModal,
  CONFIRM_DIALOG: ConfirmDialogModal,
  ERROR: ErrorModal,
  OPEN_EXAMPLE: ExamplesModal,
  OPEN_FROM_CLOUD: OpenFromCloudModal,
  OPEN_GIST: OpenGistModal, // LEGACY.
  OPEN_URL: OpenUrlModal,
  SAVE_TO_CLOUD: SaveToCloudModal,
  SAVE_TO_CLOUD_SUCCESS: SaveToCloudSuccessModal,
  SAVE_GIST: SaveGistModal, // LEGACY.
  SAVE_GIST_SUCCESS: SaveGistSuccessModal, // LEGACY
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
