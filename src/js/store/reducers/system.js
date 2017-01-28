import {
  SET_MAPZEN,
  SET_LOCALHOST,
  SET_SSL_ENABLED,
} from '../actions';

const initialState = {
  mapzen: false,
  localhost: false,
  ssl: false,
};

const settings = (state = initialState, action) => {
  switch (action.type) {
    case SET_MAPZEN:
      return {
        ...state,
        mapzen: true,
      };
    case SET_LOCALHOST:
      return {
        ...state,
        localhost: true,
      };
    case SET_SSL_ENABLED:
      return {
        ...state,
        ssl: true,
      };
    default:
      return state;
  }
};

export default settings;
