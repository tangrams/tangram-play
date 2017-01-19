/**
 * Modals
 */
import { SHOW_MODAL, HIDE_MODAL, CLEAR_MODALS } from '../actions';
import { uniqueInteger } from '../../tools/helpers';

const initialState = {
  stack: [],
};

const modals = (state = initialState, action) => {
  switch (action.type) {
    case SHOW_MODAL: {
      const newModal = {
        modalType: action.modalType,
        modalProps: action.modalProps || {},
        id: uniqueInteger(),
      };
      const stack = [...state.stack, newModal];

      return { stack };
    }
    // Hiding a modal removes its information from the modal stack.
    case HIDE_MODAL: {
      const stack = state.stack.slice(0).filter(modal => modal.key !== action.key);
      return { stack };
    }
    case CLEAR_MODALS:
      return initialState;
    default:
      return state;
  }
};

export default modals;
