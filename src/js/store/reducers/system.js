import {
  SET_MAPZEN,
  SET_LOCALHOST,
} from '../actions';

const initialState = {
  mapzen: false,
  localhost: false,
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
    default:
      return state;
  }
};

export default settings;
