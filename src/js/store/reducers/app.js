/**
 * Record various properties related to app state.
 */
import { APP_INITIALIZED, SET_APP_STATE, ADD_RECENT_SCENE } from '../actions';

const initialState = {
  // Set to true after Tangram Play has initialized - ready and waiting to
  // accept user input. The absence of the `initialized` prop in the `app`
  // state shall be treated the same as a `false` value.
  initialized: false,
  recentScenes: [],
  showEditorHiddenTooltip: false,
};

const app = (state = initialState, action) => {
  switch (action.type) {
    case APP_INITIALIZED:
      {
        return {
          ...state,
          initialized: true,
        };
      }
      // The settings is an object with an arbitrary set of properties.
      // The only property we don't want to copy is `type`, which is
      // only used in the reducer, here. Make sure we combine incoming
      // properties with existing properties.
    case SET_APP_STATE:
      {
        const settingsObj = Object.assign({}, state, action);
        delete settingsObj.type;

        return { ...settingsObj };
      }
    case ADD_RECENT_SCENE:
      {
        return {
          ...state,
          recentScenes: [...state.recentScenes, action.scene],
        };
      }
    default:
      return state;
  }
};

export default app;
