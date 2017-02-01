import { combineReducers } from 'redux';
import app from './app';
import errors from './errors';
import map from './map';
import modals from './modals';
import persistence from './persistence';
import scene from './scene';
import settings from './settings';
import system from './system';
import user from './user';

const reducers = combineReducers({
  app,
  errors,
  map,
  modals,
  persistence,
  scene,
  settings,
  system,
  user,
});

export default reducers;
