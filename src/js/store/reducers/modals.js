/**
 * Modals
 */
import { SHOW_MODAL, HIDE_MODAL } from '../actions';
import { uniqueInteger } from '../../tools/helpers';

const initialState = {
  // TODO: allow a stack of modals
  stack: [],
};

const modals = (state = initialState, action) => {
  switch (action.type) {
    case SHOW_MODAL: {
      const newModal = {
        modalType: action.modalType,
        modalProps: action.modalProps || {},
        key: uniqueInteger(),
      };
      const stack = [...state.stack, newModal];

      return { stack };
    }
    case HIDE_MODAL:
      return initialState;
    default:
      return state;
  }
};

export default modals;
