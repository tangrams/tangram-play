import React from 'react';

import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Dropdown from 'react-bootstrap/lib/Dropdown';

import ButtonSimple from './button-simple.react';
import ButtonDropdownToggle from './button-dropdown-toggle.react';
import ButtonDropdownMenu from './button-dropdown-menu.react';
import EditorIO from '../editor/io';
import { openGistModal } from '../modals/modal.open-gist';
import { takeScreenshot } from '../map/map';

const clickNew = function() {
    EditorIO.new();
};

const clickSave = function() {
    EditorIO.export();
};

const clickGist = function() {
    openGistModal.show();
};

const clickCamera = function() {
    takeScreenshot();
};

const saveMenu = [
    {
        id: 1,
        text: "Save to file",
        icon: "bt-folder",
        click: clickSave
    },
    {
        id: 2,
        text: "Save to Gist",
        icon: "bt-code",
        click: clickGist
    },
    {
        id: 3,
        text: "Take a screenshot",
        icon: "bt-camera",
        click: clickCamera
    }
];

export default React.createClass({
    render: function() {
        return (
            <ButtonToolbar>
                <ButtonGroup>
                    <ButtonSimple button_text={"New"} overlay_text={"New Scene"} icon={"bt-file"} click={clickNew} />
                    <ButtonSimple button_text={"Open"} overlay_text={"Open Scene"} icon={"bt-upload"} />
                </ButtonGroup>

                <ButtonGroup>
                    <Dropdown id="dropdown-save" >
                        <ButtonDropdownToggle bsRole="toggle" text="Save" icon="bt-download">
                        </ButtonDropdownToggle>
                        <ButtonDropdownMenu bsRole="menu" menu_items={saveMenu}>
                        </ButtonDropdownMenu>
                    </Dropdown>
                </ButtonGroup>
            </ButtonToolbar>
        );
    }
});
