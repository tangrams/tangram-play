import React from 'react';

import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Dropdown from 'react-bootstrap/lib/Dropdown';

import ButtonSimple from './button-simple.react';
import ButtonDropdownToggle from './button-dropdown-toggle.react';
import ButtonDropdownMenu from './button-dropdown-menu.react';
import EditorIO from '../editor/io';

export default React.createClass({
    render: function() {
        return (
            <ButtonToolbar>
                <ButtonGroup>
                    <ButtonSimple button_text={"New"} overlay_text={"New Scene"} icon={"bt-file"} click={someFn} />
                    <ButtonSimple button_text={"Open"} overlay_text={"Open Scene"} icon={"bt-upload"} />
                </ButtonGroup>

                <ButtonGroup>
                    <Dropdown id="dropdown-save" >
                        <ButtonDropdownToggle bsRole="toggle" text="Save" icon="bt-download">
                        </ButtonDropdownToggle>
                        <ButtonDropdownMenu bsRole="menu" menu_items={save_menu}>
                        </ButtonDropdownMenu>
                    </Dropdown>
                </ButtonGroup>
            </ButtonToolbar>
        );
    }
});

let save_menu = [
    {
        id: 1,
        text: "Save to file",
        icon: "bt-folder"
    },
    {
        id: 2,
        text: "Save to Gist",
        icon: "bt-code"
    },
    {
        id: 3,
        text: "Take a screenshot",
        icon: "bt-camera"
    }
] ;

let someFn = function() {
    console.log('new clicked');
    EditorIO.new();
} ;
