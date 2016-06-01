import React from 'react';

//import Glyphicon from 'react-bootstrap/lib/Glyphicon';
//<Glyphicon glyph="" bsClass="btm bt-file" /> --> another way to do it

import DropdownToggle from 'react-bootstrap/lib/DropdownToggle';
import Icon from './icon.react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';

export default React.createClass({
    render: function() {
        return (
            <OverlayTrigger {...this.props} placement="bottom" overlay={<Tooltip id="tooltip">test</Tooltip>}>
                <DropdownToggle {...this.props} bsClass="test">
                  <Icon type={this.props.icon} />{this.props.text}
                </DropdownToggle>
            </OverlayTrigger>
        );
    },

});
