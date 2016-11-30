/* eslint-disable no-underscore-dangle */
// Initiate Redux store
import { createStore, compose } from 'redux';

// This is where other Redux-related libs are added, e.g.
// react-router-redux if we use it in the future.

// Import the root reducer
import reducers from './reducers';

const initialState = {};

// For Redux devtools extension.
// https://github.com/zalmoxisus/redux-devtools-extension
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducers, initialState);

export default store;
