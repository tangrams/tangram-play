import { SET_SHIELD_VISIBILITY } from '../actions';

const initialState = {
  visible: false,
};

const shield = (state = initialState, action) => {
  switch (action.type) {
    case SET_SHIELD_VISIBILITY:
      return {
        visible: action.visible,
      };
    default:
      return state;
  }
};

export default shield;
