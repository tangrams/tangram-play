import React from 'react';
import PropTypes from 'prop-types';

export default function SceneItem(props) {
  return (
    <div className="open-from-cloud-option">
      <div className="open-from-cloud-option-thumbnail">
        <img src={props.thumbnail} alt="" />
      </div>
      <div className="open-from-cloud-option-info">
        <div className="open-from-cloud-option-name">
          {props.name}
        </div>
        <div className="open-from-cloud-option-description">
          {props.description}
        </div>
        <div className="open-from-cloud-option-date">
          {/* Show the date this was saved.
              TODO: better formatting;
              maybe use moment.js */}
          Saved on {new Date(props.date).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

SceneItem.propTypes = {
  thumbnail: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  date: PropTypes.string,
};

SceneItem.defaultProps = {
  description: 'No description provided.',
  date: '',
};
