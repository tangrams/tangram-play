import React from 'react';
import { Provider } from 'react-redux';
import Map from './Map';
import EditorPane from './EditorPane';
import MenuBar from './MenuBar';
import FileDrop from '../file/FileDrop';
import SignInOverlay from './SignInOverlay';
// import ColorPalette from './ColorPalette';
import ErrorsPanel from './ErrorsPanel';
// todo: combine
import ModalShield from '../modals/ModalShield';
import ModalRoot from '../modals/ModalRoot';
import Globey from './Globey';

import { initTangramPlay } from '../tangram-play';
import { showWelcomeScreen } from '../ui/welcome';
import store from '../store';

export default class App extends React.Component {
  componentDidMount() {
    initTangramPlay();
    showWelcomeScreen();
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <Provider store={store}>
        <div>
          <MenuBar />

          <div className="workspace-container">
            <div id="draggable-container">
              <div id="draggable-container-child" />
            </div>

            <div>
              <Map />
              <EditorPane />
            </div>

            <div id="glsl-pickers" />
            {/* <ColorPalette /> */}
          </div>

          <div className="overlay-container">
            <FileDrop />
            <SignInOverlay />

            <ModalShield />
            <ModalRoot />

            <ErrorsPanel />
            <Globey />
          </div>
        </div>
      </Provider>
    );
  }
}
