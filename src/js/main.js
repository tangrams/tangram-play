// Polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

// React
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Libraries
import Raven from 'raven-js';
import localforage from 'localforage';

// Components
import App from './components/App';

// Redux
import store from './store';
import { SET_SETTINGS, SET_APP_STATE } from './store/actions';

// Miscellaneous
import { migrateLocalStorageToForage } from './storage/migrate';

// Error tracking
// Load this before all other modules. Only load when run in production.
// Requires `loose-envify` package in build process to set the correct `NODE_ENV`.
if (process.env.NODE_ENV === 'production') {
  Raven.config('https://728949999d2a438ab006fed5829fb9c5@app.getsentry.com/78467', {
    whitelistUrls: [/mapzen\.com/, /www\.mapzen\.com/],
    environment: process.env.NODE_ENV,
  }).install();
}

// When hosted on production Mapzen, set document.domain to allow cross-origin
// access across subdomains.
if (document.domain.indexOf('mapzen.com') === 0) {
  document.domain = document.domain;
}

// Set and persist localForage options. This must be called before any other
// calls to localForage are made, but can be called after localForage is loaded.
localforage.config({
  name: 'Tangram Play',
  storeName: 'tangram_play',
});

// Convert all current localStorage items to localforage
// We want to do this very early on, because other scripts may need to read
// in the expected format / location in localforage
// TODO: Remove when migration is deemed unnecessary
migrateLocalStorageToForage();

const STORAGE_SETTINGS = 'settings';

// Localhost flags
if (window.location.hostname === 'localhost') {
  store.dispatch({
    type: SET_APP_STATE,
    disableMultiFile: false,
  });
}

// Settings that are stored are populated in state before we mount the
// application, so that they are available to components immediately.
// This is asynchronous, so
localforage.getItem(STORAGE_SETTINGS)
  .then((settings) => {
    store.dispatch({
      type: SET_SETTINGS,
      ...settings,
    });
  })
  .catch(() => {
    // Catch errors here so that they don't fall through and cause problems elsewhere
  })
  // Always do this regardless of whether localforage retrieval
  // or Redux state setting was successful.
  .then(() => {
    // Mount React components
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.getElementById('root')
    );
  });

// On unload, stash settings into local storage.
window.addEventListener('beforeunload', () => {
  const settings = store.getState().settings;

  if (settings) {
    localforage.setItem(STORAGE_SETTINGS, settings);
  }
});
