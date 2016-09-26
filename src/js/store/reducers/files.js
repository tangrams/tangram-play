import {
    SET_ACTIVE_FILE,
    ADD_FILE,
    REMOVE_FILE,
    CLEAR_FILES,
    MARK_FILE_CLEAN,
    MARK_FILE_DIRTY,
} from '../actions';

const initialState = {
    activeFileIndex: null,
    files: [],
};

const files = (state = initialState, action) => {
    switch (action.type) {
        case SET_ACTIVE_FILE:
            return {
                ...state,
                activeFileIndex: action.active,
            };
        case ADD_FILE:
            return {
                ...state,
                files: [...state.files, action.file],
            };
        case REMOVE_FILE:
            return {
                ...state,
                files: [
                    ...state.files.slice(0, action.fileIndex),
                    ...state.files.slice(action.fileIndex + 1),
                ],
            };
        case CLEAR_FILES:
            return {
                ...state,
                files: [],
            };
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
        default:
            return state;
    }
};

export default files;
