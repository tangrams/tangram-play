import React from 'react';

export default class Globey extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="globey">
        <div className="globey-speech-bubble">
          <div className="globey-text">
            Hi there! I'm Globey, your mapping assistant. Welcome to the brand new Tangram Work! I'm here to provide useful suggestions.
          </div>
        </div>
        <img src="./data/imgs/globey.png" />
      </div>
    );
  }
}
