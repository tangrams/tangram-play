// Redux
import store from '../store';
import { SHOW_MODAL } from '../store/actions';

export function showWelcomeScreen() {
  const persistence = store.getState().persistence;

  // TEMP: test welcome screen.
  if (persistence && persistence.welcomeScreenDismissed !== true) {
    store.dispatch({
      type: SHOW_MODAL,
      modalType: 'WELCOME',
      priority: 100, // Display above error modals
    });
  }
}
