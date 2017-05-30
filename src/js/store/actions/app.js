import { SET_APP_STATE } from './index';

/**
 * Generic action creator for setting app state.
 *
 * @param {Object} state - the app state properties to set
 */
export function setAppState(state) {
  return {
    type: SET_APP_STATE,
    ...state,
  };
}

/**
 * Action creators that are triggered on each editor change, so, only dispatch
 * when it would alter current state. This relies on redux-thunk.
 */
function reduceToDiff(reduced, obj = {}) {
  return Object.keys(obj).reduce((diff, key) => {
    if (obj[key] !== reduced[key]) {
      diff[key] = obj[key];
    }
    return diff;
  }, {});
}

function dispatchOnlyIfChanges(dispatch, reduced, obj) {
  const diff = reduceToDiff(reduced, obj);
  if (Object.keys(diff).length > 0) {
    dispatch(setAppState(diff));
  }
}

export function tangramSceneLoading(bool = false) {
  return (dispatch, getState) => {
    dispatchOnlyIfChanges(dispatch, getState().app, { tangramSceneLoading: bool });
  };
}

export function mapzenAPIKeyInjected(bool = false) {
  return (dispatch, getState) => {
    dispatchOnlyIfChanges(dispatch, getState().app, { mapzenAPIKeyInjected: bool });
  };
}

/**
 * Easter egg: shows (or hides) Globey.
 *
 * @param {Boolean} bool - `true` to turn on, `false` to turn off.
 */
export function showGlobey(bool = false) {
  return (dispatch, getState) => {
    dispatchOnlyIfChanges(dispatch, getState().app, { globey: Boolean(bool) });
  };
}
