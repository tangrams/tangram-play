import { combineReducers } from 'redux';
import files from './files';
import settings from './settings';
import shield from './shield';
import user from './user';

const reducers = combineReducers({
    files,
    settings,
    shield,
    user,
});

export default reducers;
