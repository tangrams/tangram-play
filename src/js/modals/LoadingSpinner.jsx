import React from 'react';
import Icon from '../components/icon.react';

// This should be a stateless component. Whether or not this displays should
// be set in parent component's state and passed via the `on` prop.

export default class LoadingSpinner extends React.Component {
    render () {
        let className = 'modal-thinking';
        if (this.props.on) {
            className += ' modal-thinking-cap-on';
        }

        return (
            <div className={className}>
                <Icon type={'bts bt-spinner bt-pulse'} />
                {this.props.msg || 'Working...'}
            </div>
        );
    }
}

LoadingSpinner.propTypes = {
    on: React.PropTypes.bool,
    msg: React.PropTypes.string
};
