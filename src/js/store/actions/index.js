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

export const SHOW_SIGN_IN_OVERLAY = 'SHOW_SIGN_IN_OVERLAY';
export const HIDE_SIGN_IN_OVERLAY = 'HIDE_SIGN_IN_OVERLAY';

// Toggle camera tools
export const TOGGLE_CAMERA_TOOLS = 'TOGGLE_CAMERA_TOOLS';

/* errors */
export const ADD_ERROR = 'ADD_ERROR';
export const CLEAR_ERRORS = 'CLEAR_ERRORS';

/* modals */
export const SHOW_MODAL = 'SHOW_MODAL';
export const HIDE_MODAL = 'HIDE_MODAL';
export const CLEAR_MODALS = 'CLEAR_MODALS';

/* persistence */
export const SET_PERSISTENCE = 'SET_PERSISTENCE';
export const DISMISS_WELCOME_SCREEN = 'DISMISS_WELCOME_SCREEN';
export const SET_RECENT_VERSION = 'SET_RECENT_VERSION';

// Add a scene to a list of recently opened scenes.
export const ADD_RECENT_SCENE = 'ADD_RECENT_SCENE';

/* scene */
export const OPEN_SCENE = 'OPEN_SCENE';
export const CLOSE_SCENE = 'CLOSE_SCENE';
export const SET_ACTIVE_FILE = 'SET_ACTIVE_FILE';
export const ADD_FILE = 'ADD_FILE';
export const REMOVE_FILE = 'REMOVE_FILE';
export const SET_FILE_METADATA = 'SET_FILE_METADATA';
export const MARK_FILE_CLEAN = 'MARK_FILE_CLEAN';
export const MARK_FILE_DIRTY = 'MARK_FILE_DIRTY';
export const STASH_DOCUMENT = 'STASH_DOCUMENT';
export const SAVE_SCENE = 'SAVE_SCENE';
export const MAPZEN_SAVE_SCENE = 'MAPZEN_SAVE_SCENE';

/* settings */
export const SET_SETTINGS = 'SET_SETTINGS';
export const SET_EDITOR_FONT_SIZE = 'SET_EDITOR_FONT_SIZE';
export const EDITOR_INCREASE_FONT_SIZE = 'EDITOR_INCREASE_FONT_SIZE';
export const EDITOR_DECREASE_FONT_SIZE = 'EDITOR_DECREASE_FONT_SIZE';

/* system */
export const SET_MAPZEN = 'SET_MAPZEN';
export const SET_LOCALHOST = 'SET_LOCALHOST';
export const SET_SSL_ENABLED = 'SET_SSL_ENABLED';

/* user */
export const USER_SIGNED_IN = 'USER_SIGNED_IN';
export const USER_SIGNED_OUT = 'USER_SIGNED_OUT';

/* map view */
export const UPDATE_MAP_LABEL = 'UPDATE_MAP_LABEL';
