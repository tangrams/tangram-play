import React from 'react';
import Map from './Map';
import EditorPane from './EditorPane';
import MenuBar from './MenuBar';
import ShieldContainer from '../ui/Shield';
import FileDrop from '../file/FileDrop';
import SignInOverlay from './SignInOverlay';
// import ColorPalette from './ColorPalette';
import ErrorsPanel from './ErrorsPanel';
import ModalRoot from '../modals/ModalRoot';

import { initTangramPlay } from '../tangram-play';

export default class App extends React.Component {
  componentDidMount() {
    initTangramPlay();
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
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
          <ShieldContainer />
          <FileDrop />
          <SignInOverlay />
          <div id="modal-container" className="modal-container" />
          <ModalRoot />

          <ErrorsPanel />
        </div>
      </div>
    );
  }
}
