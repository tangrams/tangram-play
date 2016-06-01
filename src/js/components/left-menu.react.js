import React from 'react';

import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';

import SimpleButton from './simple-button.react';
import DropdownButton from './dropdown-button.react';
import Icon from './icon.react';
import EditorIO from '../editor/io';

export default React.createClass({
    render: function() {
        return (
            <ButtonToolbar>
                <ButtonGroup>
                    <SimpleButton button_text={"New"} overlay_text={"New Scene"} icon={"bt-file"} click={someFn} />
                    <SimpleButton button_text={"Open"} overlay_text={"Open Scene"} icon={"bt-upload"} />
                </ButtonGroup>

                <ButtonGroup>
                    <Dropdown id="dropdown-left" >
                        <DropdownButton bsRole="toggle" text="test" icon="bt-upload">
                        </DropdownButton>
                      <Dropdown.Menu bsClass="test">
                        <MenuItem bsClass="test"><Icon type={"bt-file"} />Save to file</MenuItem>
                        <MenuItem ><Icon type={"bt-code"} />Save to Gist</MenuItem>
                        <MenuItem ><Icon type={"bt-camera"} />Active Item</MenuItem>
                      </Dropdown.Menu>
                    </Dropdown>

                    </ButtonGroup>
            </ButtonToolbar>
        );
    },

});

let someFn = function() {
    console.log('new clicked');
    EditorIO.new();
} ;
