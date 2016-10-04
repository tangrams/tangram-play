import { combineReducers } from 'redux';
import app from './app';
import errors from './errors';
import files from './files';
import settings from './settings';
import shield from './shield';
import user from './user';

const reducers = combineReducers({
    app,
    errors,
    files,
    settings,
    shield,
    user,
});

export default reducers;
