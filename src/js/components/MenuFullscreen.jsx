import React from 'react';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Icon from './Icon';

import { getFullscreenElement, toggleFullscreen } from '../ui/fullscreen';

export default class MenuFullscreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            fullscreenActive: false,
        };

        this.checkFullscreenState = this.checkFullscreenState.bind(this);
    }

    componentDidMount() {
        // Other actions (like pressing escape) can take users out of fullscreen
        // mode. When this event is fired, we check to see whether we are in
        // fullscreen mode and updates the visual state of the menu item.
        // We listen for all prefixed events because no browser currently
        // implements Fullscreen API without vendor prefixes.
        document.addEventListener('fullscreenchange', this.checkFullscreenState, false);
        document.addEventListener('mozfullscreenchange', this.checkFullscreenState, false);
        document.addEventListener('webkitfullscreenchange', this.checkFullscreenState, false);
        document.addEventListener('MSFullscreenChange', this.checkFullscreenState, false);
    }

    onClickFullscreen(event) {
        toggleFullscreen();
    }

    checkFullscreenState() {
        const fullscreenElement = getFullscreenElement();
        if (fullscreenElement) {
            this.setState({ fullscreenActive: true });
        } else {
            this.setState({ fullscreenActive: false });
        }
    }

    render() {
        return (
            <OverlayTrigger
                rootClose
                placement="bottom"
                overlay={<Tooltip id="tooltip">View fullscreen</Tooltip>}
            >
                <NavItem
                    eventKey="new"
                    onClick={this.onClickFullscreen}
                    active={this.state.fullscreenActive}
                >
                    <Icon type="bt-maximize" />Fullscreen
                </NavItem>
            </OverlayTrigger>
        );
    }
}
