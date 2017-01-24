import React from 'react';
import { connect } from 'react-redux';

// Import all modals here
import AboutModal from './AboutModal';
import WelcomeModal from './WelcomeModal';
import WhatsNewModal from './WhatsNewModal';
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
  WELCOME: WelcomeModal,
  WHATS_NEW: WhatsNewModal,
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

const ModalRoot = ({ stack }) => {
  // Sort modals by priority value -- highest is displayed on top.
  const modalComponents = stack.sort((a, b) => a.priority - b.priority)
    .map(({ modalType, modalProps, id }) => {
      if (!modalType) return null;

      const SpecificModal = MODAL_COMPONENTS[modalType];
      return <SpecificModal key={id} modalId={id} {...modalProps} />;
    });

  return <div className="modals-container">{modalComponents}</div>;
};

ModalRoot.propTypes = {
  stack: React.PropTypes.arrayOf(React.PropTypes.object),
};

ModalRoot.defaultProps = {
  stack: [],
};

export default connect(
  state => state.modals
)(ModalRoot);
