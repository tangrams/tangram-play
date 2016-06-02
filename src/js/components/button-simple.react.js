import React from 'react';

import Button from 'react-bootstrap/lib/Button';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';

import Icon from './icon.react';

let someFn = function() { console.log('new clicked'); } ;

export default React.createClass({
    render: function() {
        return (
            <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{this.props.overlay_text}</Tooltip>}>
                <Button onClick={this.props.click} bsClass="test">
                    <Icon type={this.props.icon} />
                    {this.props.button_text}
                </Button>
            </OverlayTrigger>
        );
    },

});
