import React from 'react';
import IconButton from './IconButton';

import { reloadOriginalScene } from '../tangram-play';

/**
 * Button with which user can click to refresh original scene file in the editor.
 * For use within embedded Tangram Play
 */
export default class RefreshButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            button: 'bt-sync',
        };

        this.onClick = this.onClick.bind(this);
        this.resetButton = this.resetButton.bind(this);
    }

    /**
     * On click, the button spins and calls function to refresh original scene
     */
    onClick() {
        this.setState({ button: 'bt-sync bt-spin active' });
        reloadOriginalScene();
        window.setTimeout(this.resetButton, 1000);
    }

    /**
     * Reset the button so it stops spinning
     */
    resetButton() {
        this.setState({ button: 'bt-sync' });
    }

    render() {
        return (
            <IconButton
                className="refresh-button"
                onClick={this.onClick}
                icon={this.state.button}
                tooltip="Refresh editor content"
            />
        );
    }
}
