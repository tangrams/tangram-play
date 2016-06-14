import React from 'react';

export default React.createClass({
    render: function () {
        return (
            <i className={`btm ${this.props.type}`}></i>
        );
    },

});
