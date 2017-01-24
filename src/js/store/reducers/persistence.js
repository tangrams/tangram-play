/**
 * Properties that persist across multiple sessions. Differs from "settings"
 * in that these are automatically saved to improve user's quality of life, but
 * are not explicitly editable. Persistence settings are stored in browser's
 * local storage when the browser tab is unloaded.
 */
import { takeRight } from 'lodash';
import { SET_PERSISTENCE, DISMISS_WELCOME_SCREEN, SET_RECENT_VERSION, ADD_RECENT_SCENE } from '../actions';

const MAX_RECENT_SCENES = 10;

const initialState = {
  // Set to `true` after a user has dismissed the welcome screen.
  welcomeScreenDismissed: false,

  // Set this to the most recent version of Tangram Play. A "what's new" screen
  // is displayed when the version does not match.
  mostRecentVersion: '0.0.0',

  // A list of recent scenes. WIP
  recentScenes: [],
};

const app = (state = initialState, action) => {
  switch (action.type) {
    case SET_PERSISTENCE: {
      // The settings is an object with an arbitrary set of properties.
      // The only property we don't want to copy is `type`, which is
      // only used in the reducer, here. Make sure we combine incoming
      // properties with existing properties.
      const persistenceObj = Object.assign({}, state, action);
      delete persistenceObj.type;

      return { ...persistenceObj };
    }
    case DISMISS_WELCOME_SCREEN:
      return {
        ...state,
        welcomeScreenDismissed: true,
      };
    case SET_RECENT_VERSION:
      return {
        ...state,
        mostRecentVersion: action.version,
      };
    case ADD_RECENT_SCENE:
      return {
        ...state,
        recentScenes: takeRight([...state.recentScenes, action.scene], MAX_RECENT_SCENES),
      };
    default:
      return state;
  }
};

export default app;
