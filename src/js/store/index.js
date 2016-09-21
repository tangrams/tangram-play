// Initiate Redux store
import { createStore } from 'redux';
// This is where other Redux-related libs are added, e.g.
// react-router-redux if we use it in the future.

// Import the root reducer
import reducers from './reducers';

const initialState = {}

const store = createStore(reducers, initialState);

export default store;
