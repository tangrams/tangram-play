import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Icon from './Icon';

import { reloadOriginalScene } from '../tangram-play';

/**
 * Button with which user can click to refresh original scene file in the editor.
 * For use within embedded Tangram Play
 */
export default class RefreshButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            button: 'bt-sync'
        };

        this.onClick = this.onClick.bind(this);
        this.resetButton = this.resetButton.bind(this);
    }

    /**
     * On click, the button spins and calls function to refresh original scene
     */
    onClick () {
        this.setState({ button: 'bt-sync bt-spin active' });
        reloadOriginalScene();
        window.setTimeout(this.resetButton, 1000);
    }

    /**
     * Reset the button so it stops spinning
     */
    resetButton () {
        this.setState({ button: 'bt-sync' });
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        return (
            <Button className="refresh-button" onClick={this.onClick}>
                <Icon type={this.state.button} />
            </Button>
        );
    }
}
