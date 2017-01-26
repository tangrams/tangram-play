import {
  OPEN_SCENE,
  CLOSE_SCENE,
  SET_ACTIVE_FILE,
  ADD_FILE,
  REMOVE_FILE,
  SET_FILE_METADATA,
  MARK_FILE_CLEAN,
  MARK_FILE_DIRTY,
  STASH_DOCUMENT,
  MAPZEN_SAVE_SCENE,
} from '../actions';
import { getBasePathFromUrl } from '../../tools/helpers';

const initialState = {
  // The counter increments each time a scene is open or closed
  counter: 0,
  // User-defined, human-readable name of the scene
  name: null,
  // User-defined description
  description: null,
  // Whether or not user has defined this as a "private" scene (not used)
  isPrivate: false,
  // Original URL that a scene was loaded from, if any - this is to preserve
  // relative imports and resources from this URL even after editor content
  // has been changed to a Blob URL for loading into Tangram.
  originalUrl: null,
  originalBasePath: null,
  // An array of object that describe the files that are "opened"
  files: [],
  // Indicates which of the files are currently active
  activeFileIndex: null,
  // Indicates which of the files is the main scene file (usually the
  // first one)
  rootFileIndex: null,
  // Whether the scene was saved somewhere.
  saved: false,
  // Where the scene was saved last. Valid values are "LOCAL" (for local file
  // system), "MAPZEN" (for Mapzen scene API), "ANON_GIST" (for Anonymous
  // Gist, legacy use only), or `null` if not previously saved. This variable
  // should be *set* if a file is first loaded from each of those locations.
  saveLocation: null,
  // When saved, record a timestamp.
  saveTimestamp: null,
  // Mapzen API use only: store the scene data object.
  mapzenSceneData: null,
};

/*
What is a file object? A file object can contain the following properties:

    File metadata properties

    - filename (string)
        e.g. "scene.yaml". Taken from the original file name (either from disk)
        or parsed from URL, if present. Includes the extension, if any. Can
        be renamed. Not required. A `null` or `undefined` value will be
        displayed as `untitled` in an editor tab, and when saved, a useful
        default should be provided (e.g. `scene.yaml` for root scene files).
        NOTE: only main scene files can be renamed; imported scene files
        are currently "read-only".
    - root (boolean)
        is `true` for the "main" or root scene file. Not required; non-root
        scene files do not require this property. Only one scene file should
        be `root`, typically the first one (index zero) in the `files` array.
        This should match the `rootFileIndex` property (NOTE: re-consider this
        if it's too easy to make this go out of sync). (another NOTE: re-consider
        this if it's also too easy to have more than one root file accidentally.)
    - isClean (boolean)
        whether the file is "dirty" (not saved) or "clean" (has been saved).
        Unlike other editor state properties (see below), this is always updated
        so that UI can reflect this condition at all times. This should sync
        with CodeMirror state; however, when recovering application state it is
        possible to restore a dirty document, despite being initially marked
        "clean" by a new instance of CodeMirror.
    - readOnly (boolean)
        if true, this file is opened "read-only". The UI will indicate this
        and the editor will not allow editing of this file.
    - key (string)
        an identifier to determine whether two opened files are referring to
        the same file. For external resources, use a fully-qualified URL.
        For local resources, use an absolute file path. For "in-memory" resources,
        we still need to figure out something.

    Editor state properties
    These properties are NOT guaranteed to sync with editor state, as that
    could get expensive. Instead, they are meant to be written to only when
    the document needs to be stashed in memory (e.g. to swap in another
    document, or when the user closes Tangram Play) by reading values from
    CodeMirror. If the file is later re-displayed (either by swapping it in,
    or when application state is recovered by opening Tangram Play in another
    session) these properties are read from memory and written to CodeMirror.

    - contents (string)
        text content of the body of the file. May be read directly from the disk
        or from URL prior to injecting in editor or may be retrieved from the
        editor itself.
    - cursor (object)
        an Object containing properties `ch` and `line` (CodeMirror syntax)
        defining the current position of the cursor in the file.
    - scrollInfo (object)
        an Object of signature `{left, top, width, height, clientWidth,
        clientHeight}` returned from `CodeMirror.getScrollInfo()`. This is
        obtained when a file is stashed and used to restore the original view.
    - highlightedLines (string)
        a string of all highlighted line ranges returned from
        `getAllHighlightedLines()`
    - selections (array)
        an array of all selections in the document, returned from
        `doc.listSelections()`
    - buffer (CodeMirror.Doc object)
        returned from `CodeMirror.getDoc()`. Editor buffer associated with a
        specific file. Used when operating between `.swapDoc()` operations.
        Because of its size and status (may contain self-referential properties)
        it cannot be serialized and therefore should not persist in localstorage.
        This property should be thrown away between sessions.
*/

const scene = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_SCENE:
      {
        // Copy initial state, add in any new props from action, then
        // increment the counter and set default values for active and
        // root file index if not provided.
        const mutatedAction = { ...action };
        delete mutatedAction.type; // Prevent saving of `type` in store

        // Calculate originalBasePath if originalUrl is present
        if (mutatedAction.originalUrl && !mutatedAction.originalBasePath) {
          mutatedAction.originalBasePath = getBasePathFromUrl(mutatedAction.originalUrl);
        }

        return {
          ...initialState,
          ...mutatedAction,
          counter: state.counter + 1,
          // Set the active file and root file to the first one in the
          // array unless otherwise specified. (e.g. if restoring state)
          activeFileIndex: action.activeFileIndex || 0,
          rootFileIndex: action.rootFileIndex || 0,
        };
      }
    case CLOSE_SCENE:
      // Increase counter, but reset state to initial (blank) state
      return {
        ...initialState,
        counter: state.counter + 1,
      };
    case SET_ACTIVE_FILE:
      return {
        ...state,
        activeFileIndex: action.index,
      };
    case ADD_FILE:
      {
        // Append the added file to the current list of files.
        const fileList = [...state.files, action.file];

        // If the added file should become the new active file, set the
        // active file index to the the newly added file.
        const activeFileIndex = action.activate ? fileList.length - 1 : state.activeFileIndex;

        return {
          ...state,
          files: fileList,
          activeFileIndex,
        };
      }
    case REMOVE_FILE:
      {
        // Remove a file at fileIndex.
        // Creates a new array of files without mutating the original state
        const fileList = [
          ...state.files.slice(0, action.index),
          ...state.files.slice(action.index + 1),
        ];

        // Adjust the active file index
        let activeFileIndex = state.activeFileIndex;

        // If the index of the removed removed is less than the current active file,
        // shift the activeFileIndex down to keep it referring to the same file
        if (activeFileIndex > action.index) {
          activeFileIndex -= 1;
        }

        // If the active file index is now out of bounds, it must be set
        // to one that is in bounds. If the file removed is the last one,
        // activeFileIndex is set to -1. This should generally not be
        // allowed, as there should always be a "main scene file" present
        // to represent the scene, and removing the "main scene file"
        // should call CLOSE_SCENE instead to clean up properly.
        if (activeFileIndex >= fileList.length - 1) {
          activeFileIndex = fileList.length - 1;
        }

        return {
          ...state,
          files: fileList,
          activeFileIndex,
        };
      }
    // Generically set properties for a certain file
    case SET_FILE_METADATA: {
      const { fileIndex, ...data } = action;
      delete data.type; // Prevent saving of `type` in store

      const newProps = Object.assign({}, state.files[fileIndex], data);

      return {
        ...state,
        files: [
          ...state.files.slice(0, fileIndex),
          newProps,
          ...state.files.slice(fileIndex + 1),
        ],
      };
    }
    case MARK_FILE_CLEAN:
      // TODO: return new array of files with file object at fileIndex
      // toggled dirty property
      return {
        ...state,
        files: [
          ...state.files.slice(0, action.fileIndex),
          {
            ...state.files[action.fileIndex],
            isClean: true,
          },
          ...state.files.slice(action.fileIndex + 1),
        ],
      };
    case MARK_FILE_DIRTY:
      return {
        ...state,
        files: [
          ...state.files.slice(0, action.fileIndex),
          {
            ...state.files[action.fileIndex],
            isClean: false,
          },
          ...state.files.slice(action.fileIndex + 1),
        ],
      };
    case STASH_DOCUMENT:
      return {
        ...state,
        files: [
          ...state.files.slice(0, action.index),
          {
            ...state.files[action.index],
            contents: action.contents,
            buffer: action.buffer,
          },
          ...state.files.slice(action.index + 1),
        ],
      };
    // Records properties after a scene is saved in Mapzen Scenes API.
    case MAPZEN_SAVE_SCENE:
      return {
        ...state,
        saved: true,
        saveLocation: 'MAPZEN',
        saveTimestamp: action.data.updated_at,
        mapzenSceneData: action.data,
      };
    default:
      return state;
  }
};

export default scene;
