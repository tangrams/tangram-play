/**
 * For errors and warnings reported by Tangram
 */
import {
  ADD_ERROR,
  CLEAR_ERRORS,
} from '../actions';

const initialState = {
  errors: [],
};

const errors = (state = initialState, action) => {
  switch (action.type) {
    case ADD_ERROR:
      {
        // Append an error object the current list of errors.
        return {
          ...state,
          errors: [...state.errors, action.error],
        };
      }
    case CLEAR_ERRORS:
      return {
        errors: [],
      };
    default:
      return state;
  }
};

export default errors;
