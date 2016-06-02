import React from 'react';

import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Dropdown from 'react-bootstrap/lib/Dropdown';

import ButtonSimple from './button-simple.react';
import ButtonDropdownToggle from './button-dropdown-toggle.react';
import ButtonDropdownMenu from './button-dropdown-menu.react';
import EditorIO from '../editor/io';
import { openLocalFile } from '../file/open-local';
import { examplesModal } from '../modals/modal.examples';
import { openURLModal } from '../modals/modal.open-url';
import { openGistModal } from '../modals/modal.open-gist';
import { saveGistModal } from '../modals/modal.save-gist';
import { aboutModal } from '../modals/modal.about';
import { toggleFullscreen } from '../ui/fullscreen';
import { takeScreenshot } from '../map/map';

const clickNew = function() {
    EditorIO.new();
};

const clickOpenFile = function() {
    openLocalFile();
};

const clickOpenGist = function() {
    openGistModal.show();
};

const clickOpenURL = function() {
    openURLModal.show();
};

const clickOpenExample = function() {
    examplesModal.show();
};

const clickSaveFile = function() {
    EditorIO.export();
};

const clickSaveGist = function() {
    saveGistModal.show();
};

const clickSaveCamera = function() {
    takeScreenshot();
};

const openMenu = [
    {
        id: 1,
        text: "Open a file",
        icon: "bt-folder",
        click: clickOpenFile
    },
    {
        id: 2,
        text: "Open a saved Gist",
        icon: "bt-code",
        click: clickOpenGist
    },
    {
        id: 3,
        text: "Open from URL",
        icon: "bt-link",
        click: clickOpenURL
    },
    {
        id: 4,
        text: "Choose example",
        icon: "bt-map",
        click: clickOpenExample
    }
];

const saveMenu = [
    {
        id: 1,
        text: "Save to file",
        icon: "bt-folder",
        click: clickSaveFile
    },
    {
        id: 2,
        text: "Save to Gist",
        icon: "bt-code",
        click: clickSaveGist
    },
    {
        id: 3,
        text: "Take a screenshot",
        icon: "bt-camera",
        click: clickSaveCamera
    }
];

export default React.createClass({
    render: function() {
        return (
            <ButtonToolbar>
                <ButtonGroup>
                    <ButtonSimple buttonText={"New"} overlayText={"New Scene"} icon={"bt-file"} click={clickNew} />
                </ButtonGroup>

                <ButtonGroup>
                    <Dropdown id="dropdown-open" >
                        <ButtonDropdownToggle bsRole="toggle" text="Open" overlayText="Open Scene" icon="bt-upload">
                        </ButtonDropdownToggle>
                        <ButtonDropdownMenu bsRole="menu" menuItems={openMenu}>
                        </ButtonDropdownMenu>
                    </Dropdown>
                </ButtonGroup>

                <ButtonGroup>
                    <Dropdown id="dropdown-save" >
                        <ButtonDropdownToggle bsRole="toggle" text="Save" overlayText="Save Scene" icon="bt-download">
                        </ButtonDropdownToggle>
                        <ButtonDropdownMenu bsRole="menu" menuItems={saveMenu}>
                        </ButtonDropdownMenu>
                    </Dropdown>
                </ButtonGroup>
            </ButtonToolbar>
        );
    }
});
