/**
 * Record various properties related to map state.
 */
import { UPDATE_MAP_LABEL } from '../actions';

const initialState = {
    label: null,
};

const map = (state = initialState, action) => {
    switch (action.type) {
        case UPDATE_MAP_LABEL: {
            return {
                ...state,
                label: action.label,
            };
        }
        default:
            return state;
    }
};

export default map;
