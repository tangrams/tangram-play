import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function ModalShield(props) {
  const displayStyle = props.stack.length > 0 ?
    { display: 'block' } :
    { display: 'none' };

  return <div className="shield" style={displayStyle} />;
}

ModalShield.propTypes = {
  stack: PropTypes.arrayOf(PropTypes.any),
};

ModalShield.defaultProps = {
  stack: [],
};

function mapStateToProps(state) {
  return {
    stack: state.modals.stack,
  };
}

export default connect(mapStateToProps)(ModalShield);
