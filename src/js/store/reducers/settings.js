import { SET_SETTINGS } from '../actions';

const initialState = {};

const settings = (state = initialState, action) => {
    // The settings is an object with an arbitrary set of properties.
    // The only property we don't want to copy is `type`, which is
    // only used in the reducer, here. Make sure we combine incoming
    // properties with existing properties.
    const settingsObj = Object.assign({}, state, action);
    delete settingsObj.type;

    switch (action.type) {
        case SET_SETTINGS:
            return {
                ...settingsObj,
            };
        default:
            return state;
    }
};

export default settings;
