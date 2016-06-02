import React from 'react';
import EditorIO from '../editor/io';

import Dropdown from 'react-bootstrap/lib/Dropdown';
import DropdownMenu from 'react-bootstrap/lib/DropdownMenu';
import MenuItem from 'react-bootstrap/lib/MenuItem';

import Icon from './icon.react';

export default React.createClass({
    render: function() {
        var results = this.props.menu_items;
        return (
            <Dropdown.Menu {...this.props} bsClass="dropdown">
                {results.map(function(result) {
                  return <MenuItem bsClass="test" key={result.id} onClick={result.click}><Icon type={result.icon} />{result.text}</MenuItem>;
                })}
            </Dropdown.Menu>

            );
    }

});
