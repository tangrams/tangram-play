/**
 * Modals
 */
import {
  SHOW_MODAL,
  HIDE_MODAL,
} from '../actions';

const initialState = {
  // TODO: allow a stack of modals
  // modalStack: [],
  modalType: null,
  modalProps: {},
};

const modals = (state = initialState, action) => {
  switch (action.type) {
    case SHOW_MODAL:
      return {
        modalType: action.modalType,
        modalProps: action.modalProps || {},
      };
    case HIDE_MODAL:
      return initialState;
    default:
      return state;
  }
};

export default modals;
