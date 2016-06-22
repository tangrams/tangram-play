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

const _clickNew = function () {
    EditorIO.new();
};

const _clickOpenFile = function () {
    openLocalFile();
};

const _clickOpenGist = function () {
    openGistModal.show();
};

const _clickOpenURL = function () {
    openURLModal.show();
};

const _clickOpenExample = function () {
    examplesModal.show();
};

const _clickSaveFile = function () {
    EditorIO.export();
};

const _clickSaveGist = function () {
    saveGistModal.show();
};

const _clickSaveCamera = function () {
    takeScreenshot();
};

const _clickFullscreen = function () {
    toggleFullscreen();
};

const _clickAbout = function () {
    aboutModal.show();
};

const documentationLink = 'https://mapzen.com/documentation/tangram/';
const feedbackLink = 'https://github.com/tangrams/tangram-play/issues/';

/**
 * Represents the navbar for the application
 */
export default class MenuBar extends React.Component {
    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
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
                        {/* New button*/}
                        <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'New scene'}</Tooltip>}>
                            <NavItem eventKey={'new'} onClick={_clickNew} href='#'><Icon type={'bt-file'} />New</NavItem>
                        </OverlayTrigger>

                        {/* Open dropdown */}
                        <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Open scene'}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={'bt-upload'} />Open</span>} id='open-dropdown'>
                                <MenuItem onClick={_clickOpenFile}><Icon type={'bt-folder'} />Open a file</MenuItem>
                                <MenuItem onClick={_clickOpenGist}><Icon type={'bt-code'} />Open a saved Gist</MenuItem>
                                <MenuItem onClick={_clickOpenURL}><Icon type={'bt-link'} />Open from URL</MenuItem>
                                <MenuItem onClick={_clickOpenExample}><Icon type={'bt-map'} />Choose example</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>

                        {/* Save dropdown */}
                        <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Save scene'}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={'bt-download'} />Save</span>} id='save-dropdown'>
                                <MenuItem onClick={_clickSaveFile}><Icon type={'bt-folder'} />Save to file</MenuItem>
                                <MenuItem onClick={_clickSaveGist}><Icon type={'bt-code'} />Save to Gist</MenuItem>
                                <MenuItem onClick={_clickSaveCamera}><Icon type={'bt-camera'} />Take a screenshot</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>
                    </Nav>

                    {/* Right menu section */}
                    <Nav pullRight>
                        {/* Fullscreen button */}
                        <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'View fullscreen'}</Tooltip>}>
                            <NavItem eventKey={'new'} onClick={_clickFullscreen} href='#'><Icon type={'bt-maximize'} />Fullscreen</NavItem>
                        </OverlayTrigger>

                        {/* Help dropdown */}
                        <OverlayTrigger rootClose placement='bottom' overlay={<Tooltip id='tooltip'>{'Documentation and help'}</Tooltip>}>
                            <NavDropdown title={<span><Icon type={'bt-question-circle'} />Help</span>} id='help-dropdown'>
                                <MenuItem onClick={_clickAbout}><Icon type={'bt-info-circle'} />About</MenuItem>
                                <MenuItem href={documentationLink} target='_blank'><Icon type={'bt-book'} />Documentation</MenuItem>
                                <MenuItem href={feedbackLink} target='_blank'><Icon type={'bt-comments'} />Feedback</MenuItem>
                            </NavDropdown>
                        </OverlayTrigger>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}
