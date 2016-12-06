/**
 * For errors and warnings reported by Tangram
 */
import { uniqWith, isEqual } from 'lodash';
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
        // Filter out identical errors.
        const errorsCollection = [...state.errors, action.error];

        return {
          ...state,
          errors: uniqWith(errorsCollection, isEqual),
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
