import React from 'react';

/**
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default class Icon extends React.PureComponent {
    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render() {
        let className = `btm ${this.props.type}`;

        if (this.props.active) {
            className += ' icon-active';
        }

        return (
            <i className={className} />
        );
    }
}

/**
 * Prop validation required by React
 */
Icon.propTypes = {
    type: React.PropTypes.string.isRequired,
    active: React.PropTypes.bool,
};
