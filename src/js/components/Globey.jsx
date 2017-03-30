import React from 'react';

import Draggable from 'react-draggable';
import EventEmitter from './event-emitter';

export default class Globey extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
    }
  }

  componentDidMount() {
    // respond to event
    EventEmitter.subscribe('show_globey', () => { this.setState({ show: true }); });
  }

  render() {
    if (this.state.show === false) return null;

    return (
      <Draggable
        bounds="#draggable-container"
        handle=".globey-image"
      >
        <div className="globey">
          <div className="globey-speech-bubble">
            <div className="globey-text">
              Hi there! I'm Globey, your mapping assistant. Welcome to the brand new Tangram Work! I'm here to provide useful suggestions.
            </div>
          </div>
          <div className="globey-image">
            <img src="./data/imgs/globey.png" />
          </div>
        </div>
      </Draggable>
    );
  }
}
