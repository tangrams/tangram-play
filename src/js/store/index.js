// Initiate Redux store
import { createStore } from 'redux';
// This is where other Redux-related libs are added, e.g.
// react-router-redux if we use it in the future.

// Import the root reducer
import reducers from './reducers';

const initialState = {};

/* eslint-disable no-underscore-dangle */
const store = createStore(reducers, initialState,
    // For Redux devtools extension.
    // https://github.com/zalmoxisus/redux-devtools-extension
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
