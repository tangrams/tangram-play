import {
    OPEN_SCENE,
    CLOSE_SCENE,
    SET_ACTIVE_FILE,
    ADD_FILE,
    REMOVE_FILE,
    MARK_FILE_CLEAN,
    MARK_FILE_DIRTY,
    STASH_DOCUMENT,
} from '../actions';

const initialState = {
    // The counter increments each time a scene is open or closed
    counter: 0,
    // Indicates which of the files are currently active
    activeFileIndex: null,
    // An array of object that describe the files that are "opened"
    files: [],
};

const scene = (state = initialState, action) => {
    switch (action.type) {
        case OPEN_SCENE:
            return {
                ...state,
                counter: state.counter + 1,
                files: [...action.files],
                // Set the active file to the first one in the index
                activeFileIndex: 0,
            };
        case CLOSE_SCENE:
            return {
                ...state,
                counter: state.counter + 1,
                files: [],
                activeFileIndex: null,
            };
        case SET_ACTIVE_FILE:
            return {
                ...state,
                activeFileIndex: action.index,
            };
        case ADD_FILE: {
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
        case REMOVE_FILE: {
            // Remove a file at fileIndex.
            // Creates a new array of files without mutating the original state
            const fileList = [
                ...state.files.slice(0, action.index),
                ...state.files.slice(action.index + 1),
            ];

            // If the active file index is now out of bounds, it must be set
            // to one that is in bounds. If the file removed is the last one,
            // activeFileIndex is set to -1.
            // TODO: Should this be allowed? Can the last file ever be removed
            // or should that be a CLOSE_SCENE situation?
            let activeFileIndex = state.activeFileIndex;
            if (activeFileIndex >= fileList.length - 1) {
                activeFileIndex = fileList.length - 1;
            }

            return {
                ...state,
                files: fileList,
                activeFileIndex,
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
                        is_clean: true,
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
                        is_clean: false,
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
                        buffer: action.buffer,
                    },
                    ...state.files.slice(action.index + 1),
                ],
            };
        default:
            return state;
    }
};

export default scene;
