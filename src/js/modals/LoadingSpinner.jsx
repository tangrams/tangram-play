import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../components/Icon';

export default function LoadingSpinner(props) {
  let className = 'loading-spinner';
  if (props.on) {
    className += ' loading-spinner-on';
  }

  return (
    <div className={className}>
      <Icon type="bts bt-spinner bt-pulse" />
      {props.msg}
    </div>
  );
}

LoadingSpinner.propTypes = {
  on: PropTypes.bool,
  msg: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  on: false,
  msg: 'Working...',
};
