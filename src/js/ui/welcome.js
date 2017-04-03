import { isNewMinorVersion, recordCurrentVersion } from '../tools/version';

// Redux
import store from '../store';
import { SHOW_MODAL } from '../store/actions';

export function showWelcomeScreen() {
  const persistence = store.getState().persistence;

  if (!persistence) return;

  if (persistence.welcomeScreenDismissed === false) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'WELCOME',
      priority: 100, // Display above error modals
    });
  } else if (isNewMinorVersion() === true) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'WHATS_NEW',
      priority: 100, // Display above error modals
    });
  }

  recordCurrentVersion();
}
