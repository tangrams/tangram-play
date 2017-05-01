import React from 'react';
import PropTypes from 'prop-types';

/**
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default function Icon(props) {
  let className = `btm ${props.type}`;

  if (props.active) {
    className += ' icon-active';
  }

  // Additional classes
  if (props.className) {
    className += ` ${props.className}`;
  }

  return (
    <i className={className} />
  );
}

Icon.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
  active: PropTypes.bool,
};

Icon.defaultProps = {
  className: '',
  active: false,
};
