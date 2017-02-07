import React from 'react';
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
  on: React.PropTypes.bool,
  msg: React.PropTypes.string,
};

LoadingSpinner.defaultProps = {
  on: false,
  msg: 'Working...',
};
