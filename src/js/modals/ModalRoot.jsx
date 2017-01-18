import React from 'react';
import { connect } from 'react-redux';

// Import all modals here
import ExamplesModal from './ExamplesModal';
import OpenGistModal from './OpenGistModal';

const MODAL_COMPONENTS = {
  OPEN_EXAMPLE_MODAL: ExamplesModal,
  OPEN_GIST_MODAL: OpenGistModal,
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
