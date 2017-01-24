import {
  SET_SETTINGS,
  SET_EDITOR_FONT_SIZE,
  EDITOR_DECREASE_FONT_SIZE,
  EDITOR_INCREASE_FONT_SIZE,
} from '../actions';

const MINIMUM_FONT_SIZE = 8;

const initialState = {
  editorFontSize: 14,
};

const settings = (state = initialState, action) => {
  switch (action.type) {
    case SET_SETTINGS: {
      // The settings is an object with an arbitrary set of properties.
      // The only property we don't want to copy is `type`, which is
      // only used in the reducer, here. Make sure we combine incoming
      // properties with existing properties.
      const settingsObj = Object.assign({}, state, action);
      delete settingsObj.type;

      return { ...settingsObj };
    }
    case SET_EDITOR_FONT_SIZE:
      return {
        ...state,
        editorFontSize: action.editorFontSize,
      };
    case EDITOR_DECREASE_FONT_SIZE:
      return {
        ...state,
        editorFontSize: Math.max(state.editorFontSize - 1, MINIMUM_FONT_SIZE),
      };
    case EDITOR_INCREASE_FONT_SIZE:
      return {
        ...state,
        editorFontSize: state.editorFontSize + 1,
      };
    default:
      return state;
  }
};

export default settings;
