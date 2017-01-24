import React from 'react';
import { connect } from 'react-redux';

function ModalShield(props) {
  const displayStyle = props.stack.length > 0 ?
    { display: 'block' } :
    { display: 'none' };

  return <div className="shield" style={displayStyle} />;
}

ModalShield.propTypes = {
  stack: React.PropTypes.arrayOf(React.PropTypes.any),
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
