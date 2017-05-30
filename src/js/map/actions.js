// Redux
import store from '../store';
import { tangramSceneLoading } from '../store/actions/app';

/**
 * Shows the scene loading indicator.
 */
export function showSceneLoadingIndicator() {
  store.dispatch(tangramSceneLoading(true));
}

/**
 * Hide the scene loading indicator.
 */
export function hideSceneLoadingIndicator() {
  store.dispatch(tangramSceneLoading(false));
}
