import { SET_APP_STATE } from './index';

export function showGlobey(bool = true) {
  return {
    type: SET_APP_STATE,
    globey: bool,
  };
}
