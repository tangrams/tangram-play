import React from 'react';

/**
 * Represents an icon that receives a 'type' prop indicating how it should look
 * as well as an optional 'active' prop indicating whether icon should be active
 */
export default function Icon(props) {
    let className = `btm ${props.type}`;

    if (props.active) {
        className += ' icon-active';
    }

    return (
        <i className={className} />
    );
}

Icon.propTypes = {
    type: React.PropTypes.string.isRequired,
    active: React.PropTypes.bool,
};
