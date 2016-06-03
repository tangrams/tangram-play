import React from 'react';

import MenuItem from 'react-bootstrap/lib/MenuItem';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';

import Icon from './icon.react';

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

const clickFullscreen = function() {
    toggleFullscreen();
};

const documentationLink = "https://mapzen.com/documentation/tangram/" ;
const feedbackLink = "https://github.com/tangrams/tangram-play/issues/" ;

const clickAbout = function() {
    aboutModal.show();
};

export default React.createClass({
    render: function() {
        return (
            <Navbar inverse>
                {/* The brand section */}
                <Navbar.Header>
                    <Navbar.Brand>
                        <span className='brand'>Tangram Play<span className='brand-tag'>BETA</span></span>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>

                <Navbar.Collapse>
                    {/* Left menu section */}
                    <Nav pullLeft>
                        {/* New button */}
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{"New scene"}</Tooltip>}>
                            <NavItem eventKey={"new"} onClick={clickNew} href="#"><Icon type={"bt-file"} />New</NavItem>
                        </OverlayTrigger>

                        {/* Open dropdown */}
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{"Open scene"}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={"bt-upload"} />Open</span>} id="open-dropdown">
                                <MenuItem onClick={clickOpenFile}><Icon type={"bt-folder"} />Open a file</MenuItem>
                                <MenuItem onClick={clickOpenGist}><Icon type={"bt-code"} />Open a saved Gist</MenuItem>
                                <MenuItem onClick={clickOpenURL}><Icon type={"bt-link"} />Open from URL</MenuItem>
                                <MenuItem onClick={clickOpenExample}><Icon type={"bt-map"} />Choose example</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>

                        {/* Save dropdown */}
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{"Save scene"}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={"bt-download"} />Save</span>} id="save-dropdown">
                                <MenuItem onClick={clickSaveFile}><Icon type={"bt-folder"} />Save to file</MenuItem>
                                <MenuItem onClick={clickSaveGist}><Icon type={"bt-code"} />Save to Gist</MenuItem>
                                <MenuItem onClick={clickSaveCamera}><Icon type={"bt-camera"} />Take a Screenshot</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>
                    </Nav>

                    {/* Right menu section */}
                    <Nav pullRight>
                        {/* Fullscreen button */}
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{"View fullscreen"}</Tooltip>}>
                            <NavItem eventKey={"new"} onClick={clickFullscreen} href="#"><Icon type={"bt-maximize"} />Fullscreen</NavItem>
                        </OverlayTrigger>

                        {/* Help dropdown */}
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip">{"Documentation and help"}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={"bt-question-circle"} />Help</span>} id="help-dropdown">
                                <MenuItem onClick={clickAbout}><Icon type={"bt-folder"} />About</MenuItem>
                                <MenuItem href={documentationLink} target="_blank"><Icon type={"bt-code"} />Documentation</MenuItem>
                                <MenuItem href={feedbackLink} target="_blank"><Icon type={"bt-camera"} />Feedback</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
});
