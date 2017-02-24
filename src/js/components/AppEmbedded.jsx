import React from 'react';
import { Provider } from 'react-redux';
import Map from './Map';
import EditorPane from './EditorPane';
import RefreshButton from './RefreshButton';

import store from '../store';
import { initTangramPlay } from '../tangram-play';

/**
 * This class is identical to normal Tangram Play but represents an embedded version of the app
 */
export default class AppEmbedded extends React.Component {
  componentDidMount() {
    initTangramPlay();
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <Provider store={store}>
        <div className="workspace-container">
          <div id="draggable-container">
            <div id="draggable-container-child" />
          </div>

          <div>
            <Map />
            <EditorPane />
          </div>

          <RefreshButton />
        </div>
      </Provider>
    );
  }
}
