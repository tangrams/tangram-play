/**
 * Record various properties related to app state.
 */
import { APP_INITIALIZED, SET_APP_STATE } from '../actions';

const initialState = {
  // Set to `true` after Tangram Play has initialized - ready and waiting to
  // accept user input. The absence of the `initialized` prop in the `app`
  // state shall be treated the same as a `false` value.
  initialized: false,

  // Set to `true` for debug mode
  debug: false,

  // Set to `true` while Tangram is loading and rendering a scene.
  tangramSceneLoading: false,

  recentScenes: [],
  showEditorHiddenTooltip: false,

  // Whether the application is running with the /embed path.
  isEmbedded: false,
  disableMapToolbar: false,

  // Whether editor should be allowed to handle multiple files.
  // This feature is experimental and should be disabled in production and in
  // embedded modes.
  disableMultiFile: true,

  // Whether editor should display the tab bar. This is view-only.
  showEditorTabBar: true,
};

const app = (state = initialState, action) => {
  switch (action.type) {
    case APP_INITIALIZED:
      return {
        ...state,
        initialized: true,
      };
      // The settings is an object with an arbitrary set of properties.
      // The only property we don't want to copy is `type`, which is
      // only used in the reducer, here. Make sure we combine incoming
      // properties with existing properties.
    case SET_APP_STATE: {
      const settingsObj = Object.assign({}, state, action);
      delete settingsObj.type;

      return { ...settingsObj };
    }
    default:
      return state;
  }
};

export default app;
