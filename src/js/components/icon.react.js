import React from 'react';

//import Glyphicon from 'react-bootstrap/lib/Glyphicon';
//<Glyphicon glyph="" bsClass="btm bt-file" /> --> another way to do it

export default React.createClass({
    render: function() {
        return (
            <i className={`btm ${ this.props.type}`}></i>
        );
    },

});
