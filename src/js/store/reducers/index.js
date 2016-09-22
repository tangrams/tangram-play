import { combineReducers } from 'redux';
import user from './user';
import shield from './shield';

const reducers = combineReducers({
    user,
    shield,
});

export default reducers;
