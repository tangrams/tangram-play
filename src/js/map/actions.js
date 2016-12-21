// Redux
import store from '../store';
import { SET_APP_STATE } from '../store/actions';

/**
 * Shows the scene loading indicator.
 *
 * TODO: Deprecate / remove. Map loading should be set via application state.
 */
export function showSceneLoadingIndicator() {
  store.dispatch({
    type: SET_APP_STATE,
    tangramSceneLoading: true,
  });
}

/**
 * Hide the scene loading indicator.
 *
 * TODO: Deprecate / remove. Map loading should be set via application state.
 */
export function hideSceneLoadingIndicator() {
  store.dispatch({
    type: SET_APP_STATE,
    tangramSceneLoading: false,
  });
}
