// Polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

// React
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Libraries
import Raven from 'raven-js';

// Components
import AppEmbedded from './components/AppEmbedded';

// Redux
import store from './store';
import { SET_APP_STATE } from './store/actions';

// Miscellaneous
import { getQueryStringObject } from './tools/url-state';

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

// Set some application state variables that control the view in embedded mode
store.dispatch({
  type: SET_APP_STATE,
  debug: (getQueryStringObject().debug === 'true'),
  isEmbedded: true,
  disableMapToolbar: true,
  disableMultiFile: true,
  showEditorTabBar: false,
});

// Mount React components
ReactDOM.render(
  <Provider store={store}>
    <AppEmbedded />
  </Provider>,
  document.getElementById('root')
);
