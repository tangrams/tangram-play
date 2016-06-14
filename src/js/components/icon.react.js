import React from 'react';

export default class Icon extends React.Component {
    render () {
        return (
            <i className={`btm ${this.props.type}`}></i>
        );
    }
}

Icon.propTypes = {
    type: React.PropTypes.string
};
