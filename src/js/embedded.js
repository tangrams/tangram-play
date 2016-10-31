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

// Error tracking
// Load this before all other modules. Only load when run in production.
// Requires `loose-envify` package in build process to set the correct `NODE_ENV`.
if (process.env.NODE_ENV === 'production') {
  Raven.config('https://728949999d2a438ab006fed5829fb9c5@app.getsentry.com/78467', {
    whitelistUrls: [/mapzen\.com/, /www\.mapzen\.com/],
    environment: process.env.NODE_ENV,
  }).install();
}

// Mount React components
ReactDOM.render(
  <Provider store={store}>
    <AppEmbedded />
  </Provider>,
  document.getElementById('tangram-play-app')
);
