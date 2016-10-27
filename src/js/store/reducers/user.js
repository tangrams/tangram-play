import { USER_SIGNED_IN, USER_SIGNED_OUT } from '../actions';

const initialState = {
    id: null,
    nickname: null,
    email: null,
    avatar: null,
    admin: false,
};

const user = (state = initialState, action) => {
    switch (action.type) {
        // If a user is signed in, we return the relevant properties from
        // Mapzen's user endpoint to the store.
        case USER_SIGNED_IN:
            return {
                id: action.id,
                nickname: action.nickname,
                email: action.email,
                avatar: action.avatar,
                admin: action.admin || false,
            };
        // If a user is signed out, we clear all user data. Absense of this
        // information (in particular, the `nickname` property) is enough to
        // indicate that the user is signed out. We do not need to use a separate
        // `logged_in: true` (or similar) property to do this.
        case USER_SIGNED_OUT:
            // Ensure that the return object is a clone, not a reference
            return Object.assign({}, initialState);
        default:
            return state;
    }
};

export default user;
