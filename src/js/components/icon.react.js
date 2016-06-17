import React from 'react';

/**
 * Icon Component
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default class Icon extends React.Component {
    render () {
        return (
            <i className={`btm ${this.props.type} ${this.props.active}`}></i>
        );
    }
}

/**
 * Prop validation required by React
 */
Icon.propTypes = {
    type: React.PropTypes.string,
    active: React.PropTypes.string
};
