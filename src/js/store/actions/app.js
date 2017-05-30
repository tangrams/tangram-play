import { SET_APP_STATE } from './index';

function setGlobeyState(bool) {
  return {
    type: SET_APP_STATE,
    globey: bool,
  };
}

export function showGlobey(bool = false) {
  return (dispatch, getState) => {
    if (getState().app.globey !== bool) {
      dispatch(setGlobeyState(bool));
    }
  };
}
