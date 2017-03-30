import React from 'react';

import Draggable from 'react-draggable';
import EventEmitter from './event-emitter';

const INITIAL_MESSAGE = 'Hi there! I\'m Globey, your mapping assistant. Welcome to the brand new Tangram Work! I\'m here to provide useful suggestions.';
const RETURN_MESSAGES = [
  'Do you need any more help?',
  'I see you are looking at Los Angeles. Did you know that it is to the east of Las Vegas?',
  'Its-a me! Globey!',
  'Mercator is my favorite projection!',
  'It looks like you are making a web map, wow!'
];
const MESSAGES = [
  'Did you know?',
  'You can\'t make an omelette without breaking an egg!',
  'This web mapping stuff sure is neat!'
];

export default class Globey extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      message: INITIAL_MESSAGE,
    };

    this.dismiss = this.dismiss.bind(this);
    this.nextMessage = this.nextMessage.bind(this);
  }

  componentDidMount() {
    // respond to event
    EventEmitter.subscribe('show_globey', () => { this.setState({ show: true }); });
  }

  nextMessage() {
    const pick = Math.floor(Math.random() * MESSAGES.length);
    this.setState({ message: MESSAGES[pick] });
  }

  dismiss() {
    this.setState({ show: false });
    window.setTimeout(() => {
      const pick = Math.floor(Math.random() * RETURN_MESSAGES.length);
      this.setState({ show: true, message: RETURN_MESSAGES[pick] });
    }, 8000);
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
              {this.state.message}
            </div>
            <div className="globey-nav">
              <button className="globey-button" onClick={this.nextMessage}>Continue</button>
              <button className="globey-button globey-button-right" onClick={this.dismiss}>Dismiss</button>
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
