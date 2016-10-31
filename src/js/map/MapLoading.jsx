import React from 'react';

// Required event dispatch and subscription for now while
// parts of app are React components and others are not
import EventEmitter from '../components/event-emitter';

export default class MapLoading extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    // When a Modal component fires "on", shield turns itself on.
    EventEmitter.subscribe('maploading:on', () => {
      this.setState({ loading: true });
    });

    // When a Modal component fires "off", shield turns itself off.
    EventEmitter.subscribe('maploading:off', () => {
      this.setState({ loading: false });
    });
  }

  render() {
    let classNames = 'map-loading';
    if (this.state.loading) {
      classNames += ' map-loading-show';
    }

    return <div className={classNames} />;
  }
}

/**
 * Shows the scene loading indicator.
 *
 * TODO: Deprecate / remove. Map loading should be set via application state.
 */
export function showSceneLoadingIndicator() {
  EventEmitter.dispatch('maploading:on', {});
}

/**
 * Hide the scene loading indicator.
 *
 * TODO: Deprecate / remove. Map loading should be set via application state.
 */
export function hideSceneLoadingIndicator() {
  EventEmitter.dispatch('maploading:off', {});
}
