/**
 * Redux store actions.
 *
 * A "best practice" for large applications is to store actions as string
 * constants. The following text is copied from Redux documentation:
 * http://redux.js.org/docs/recipes/ReducingBoilerplate.html#actions
 *
 *  > Why is this beneficial? It is often claimed that constants are unnecessary,
 *  > and for small projects, this might be correct. For larger projects, there
 *  > are some benefits to defining action types as constants:
 *
 *  >   - It helps keep the naming consistent because all action types are
 *  >     gathered in a single place.
 *  >   - Sometimes you want to see all existing actions before working on a
 *  >     new feature. It may be that the action you need was already added by
 *  >     somebody on the team, but you didn't know.
 *  >   - The list of action types that were added, removed, and changed in a
 *  >     Pull Request helps everyone on the team keep track of scope and
 *  >     implementation of new features.
 *  >   - If you make a typo when importing an action constant, you will get
 *  >     `undefined`. Redux will immediately throw when dispatching such an
 *  >     action, and you'll find the mistake sooner.
 *
 * Following that suggestion, we will collect and export all actions as string
 * constants from this module.
 *
 * We are not currently exporting action creators (see that documentation to
 * learn more about them). This may change in the future as the need arises,
 * but for now all scripts can dispatch to the store directly.
 *
 * > Action creators have often been criticized as boilerplate. Well, you don't
 * > have to write them!
 */

/* app */

// Dispatch this action when Tangram Play has fully initialized - when it is
// first ready to accept user input. A scene does not have to be loaded to be
// considered initialized - Tangram Play is initialized if it is ready and
// waiting for the user to load a scene.
export const APP_INITIALIZED = 'APP_INITIALIZED';

// Generic action for setting app state.
export const SET_APP_STATE = 'SET_APP_STATE';

// Add a scene to a list of recently opened scenes.
export const ADD_RECENT_SCENE = 'ADD_RECENT_SCENE';

/* errors */
export const ADD_ERROR = 'ADD_ERROR';
export const CLEAR_ERRORS = 'CLEAR_ERRORS';

/* scene */
export const OPEN_SCENE = 'OPEN_SCENE';
export const CLOSE_SCENE = 'CLOSE_SCENE';
export const SET_ACTIVE_FILE = 'SET_ACTIVE_FILE';
export const ADD_FILE = 'ADD_FILE';
export const REMOVE_FILE = 'REMOVE_FILE';
export const MARK_FILE_CLEAN = 'MARK_FILE_CLEAN';
export const MARK_FILE_DIRTY = 'MARK_FILE_DIRTY';
export const STASH_DOCUMENT = 'STASH_DOCUMENT';

/* settings */
export const SET_SETTINGS = 'SET_SETTINGS';
export const EDITOR_INCREASE_FONT_SIZE = 'EDITOR_INCREASE_FONT_SIZE';
export const EDITOR_DECREASE_FONT_SIZE = 'EDITOR_DECREASE_FONT_SIZE';

/* user */
export const USER_SIGNED_IN = 'USER_SIGNED_IN';
export const USER_SIGNED_OUT = 'USER_SIGNED_OUT';

// Legacy assistance
// If shield is only controlled by modal visibility, it should be be turned
// on based on number of modals in a stack (todo)
export const SET_SHIELD_VISIBILITY = 'SET_SHIELD_VISIBILITY';
