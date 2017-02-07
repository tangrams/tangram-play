import VERSION from '../version.json';

// Redux
import store from '../store';
import { SHOW_MODAL, SET_RECENT_VERSION } from '../store/actions';

export function showWelcomeScreen() {
  const persistence = store.getState().persistence;

  if (!persistence) return;

  // TEMP: test welcome screen.
  if (persistence.welcomeScreenDismissed !== true) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'WELCOME',
      priority: 100, // Display above error modals
    });
  } else if (VERSION.v !== persistence.mostRecentVersion) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'WHATS_NEW',
      priority: 100, // Display above error modals
    });
  }

  // Store most recent version seen
  store.dispatch({
    type: SET_RECENT_VERSION,
    version: VERSION.v,
  });
}
