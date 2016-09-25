import { combineReducers } from 'redux';
import files from './files';
import shield from './shield';
import user from './user';

const reducers = combineReducers({
    files,
    shield,
    user,
});

export default reducers;
