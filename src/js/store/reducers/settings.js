import { SET_SETTINGS, EDITOR_DECREASE_FONT_SIZE, EDITOR_INCREASE_FONT_SIZE } from '../actions';

const MINIMUM_FONT_SIZE = 8;

const initialState = {
    editorFontSize: 14,
};

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
        case EDITOR_DECREASE_FONT_SIZE:
            return {
                ...settingsObj,
                editorFontSize: Math.max(state.editorFontSize - 1, MINIMUM_FONT_SIZE),
            };
        case EDITOR_INCREASE_FONT_SIZE:
            return {
                ...settingsObj,
                editorFontSize: state.editorFontSize + 1,
            };
        default:
            return state;
    }
};

export default settings;
