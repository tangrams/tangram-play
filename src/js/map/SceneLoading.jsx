/**
 * Shows a loading indicator when Tangram is loading and building a new
 * scene. It is hidden when Tangram is done (after Tangram's `view_complete`
 * event callback, or on Tangram error.
 */
import React from 'react';
import { connect } from 'react-redux';

function SceneLoading(props) {
  let classNames = 'map-loading';
  if (props.loading) {
    classNames += ' map-loading-show';
  }

  return <div className={classNames} />;
}

SceneLoading.propTypes = {
  loading: React.PropTypes.bool,
};

SceneLoading.defaultProps = {
  loading: false,
};

function mapStateToProps(state) {
  return {
    loading: state.app.tangramSceneLoading,
  };
}

export default connect(mapStateToProps)(SceneLoading);
