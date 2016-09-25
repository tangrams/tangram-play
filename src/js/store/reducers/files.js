import { ADD_FILE, REMOVE_FILE, CLEAR_FILES } from '../actions';

const initialState = {
    files: [],
};

const files = (state = initialState, action) => {
    switch (action.type) {
        case ADD_FILE:
            return {
                files: [...state.files, action.file],
            };
        case REMOVE_FILE:
            return {
                files: [
                    ...state.items.slice(0, action.file),
                    ...state.items.slice(action.file + 1),
                ],
            };
        case CLEAR_FILES:
            return {
                files: [],
            };
        default:
            return state;
    }
};

export default files;
