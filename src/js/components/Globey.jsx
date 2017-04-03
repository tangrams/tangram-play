import React from 'react';
import { connect } from 'react-redux';
import Draggable from 'react-draggable';
import { showGlobey } from '../store/actions/app';

const INITIAL_MESSAGE = 'Hi there! I\'m Globey, your mapping assistant. Welcome to Tangram Play! I\'m here to provide useful suggestions.';
const RETURN_MESSAGES = [
  'Do you need any more help?',
  'Its-a me! Globey!',
  'Mercator is my favorite projection!',
  'It looks like you are making a web map, wow!',
  'Are you sure you don\'t need help? I\'m here for you.',
  'Maps are hard!',
  'Oh, I wouldn\'t do that if I were you.',
  'Daisy, Daisy, \n give your me your answer do.\n I\'m half crazy, \n all for the love of you.',
];
const MESSAGES = [
  'Did you know?',
  'You can\'t make an omelette without breaking an egg!',
  'This web mapping stuff sure is neat!',
  'The earth is not quite a sphere.',
  'Don\'t get lat/lon confused with lon/lat!',
  'Curved labels are new!',
  'Did you know Los Angeles is to the east of Las Vegas?',
  'There are a lot of lakes in Canada!',
  'Africa is the only continent that is in all four hemispheres, and also the only continent to have land on the prime meridian and the equator.',
  'About 71 percent of the Earth\'s surface is covered in water! That must mean a lot of map tiles are just water!',
  'Am I helping you yet?',
  'Don\'t worry if you don\'t understand everything right away!',
  'You can change the projection by writing some shader code!',
  'What do maps and fish have in common? Both have scales.',
  'Why do paper maps never win poker games? Because they always fold.',
  'What kind of maps do spiders make? A web map.',
  'Why did the dot go to college? Because it wanted to be a graduated symbol.',
];

class Globey extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      message: INITIAL_MESSAGE,
    };

    this.previousMessage = -1;

    this.dismiss = this.dismiss.bind(this);
    this.nextMessage = this.nextMessage.bind(this);
  }

  nextMessage() {
    const pick = Math.floor(Math.random() * MESSAGES.length);
    if (this.previousMessage === pick) {
      this.nextMessage();
    } else {
      this.previousMessage = pick;
      this.setState({ message: MESSAGES[pick] });
    }
  }

  dismiss() {
    this.props.dispatch(showGlobey(false));

    window.setTimeout(() => {
      const pick = Math.floor(Math.random() * RETURN_MESSAGES.length);
      this.props.dispatch(showGlobey(true));
      this.setState({ message: RETURN_MESSAGES[pick] });
    }, 8000);
  }

  render() {
    if (this.props.show === false) return null;

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
              <button className="globey-button" onClick={this.nextMessage}>
                Continue
              </button>
              <button className="globey-button globey-button-right" onClick={this.dismiss}>
                Dismiss
              </button>
            </div>
          </div>
          <div className="globey-image">
            <img src="./data/imgs/globey.gif" alt="Globey" />
          </div>
        </div>
      </Draggable>
    );
  }
}

Globey.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  show: React.PropTypes.bool.isRequired,
};

Globey.defaultProps = {
  show: false,
};

function mapStateToProps(state) {
  return {
    show: state.app.globey,
  };
}

export default connect(mapStateToProps)(Globey);
