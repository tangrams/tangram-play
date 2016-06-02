import React from 'react';

import DropdownToggle from 'react-bootstrap/lib/DropdownToggle';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';

import Icon from './icon.react';

export default React.createClass({
    render: function() {
        return (
            <OverlayTrigger {...this.props} placement="bottom" overlay={<Tooltip id="tooltip">test</Tooltip>}>
                <DropdownToggle {...this.props} bsClass="test">
                  <Icon type={this.props.icon} />{this.props.text}
                </DropdownToggle>
            </OverlayTrigger>
        );
    }

});
