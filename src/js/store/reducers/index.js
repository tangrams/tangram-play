import { combineReducers } from 'redux';
import app from './app';
import errors from './errors';
import map from './map';
import scene from './scene';
import settings from './settings';
import shield from './shield';
import user from './user';

const reducers = combineReducers({
  app,
  errors,
  map,
  scene,
  settings,
  shield,
  user,
});

export default reducers;
