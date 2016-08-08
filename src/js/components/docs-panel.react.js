import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';

import { editor } from '../editor/editor';

/**
 * Represents the main map panel that user can toggle in and out of the leaflet
 * map.
 */
export default class DocsPanel extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);
        this.state = {
            open: true, // Whether panel should be open or not
            display: ''
        };

        this._togglePanel = this._togglePanel.bind(this);
    }

    componentDidMount () {
        const wrapper = editor.getWrapperElement();

        wrapper.addEventListener('mouseup', (event) => {
            // bail out if we were doing a selection and not a click
            if (editor.somethingSelected()) {
                return;
            }

            let cursor = editor.getCursor(true);

            let line = editor.lineInfo(cursor.line);
            let nodes = line.handle.stateAfter.nodes;
            let node;

            if (nodes.length === 1) {
                node = nodes[0].address;
                this.setState({ display: node });
            }
            else {
                console.log('line has more than one node');
            }
        });
    }

    /**
     * Toggle the panel so it is visible or not visible
     */
    _togglePanel () {
        this.setState({ open: !this.state.open });
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        return (
            <div>
                {/* Toggle docs panel to show it*/}
                <OverlayTrigger rootClose placement='top' overlay={<Tooltip id='tooltip'>{'Toogle docs toolbar'}</Tooltip>}>
                    <Button onClick={this._togglePanel} className='docs-panel-button-show'>
                        <Icon type={'bt-caret-up'} />
                    </Button>
                </OverlayTrigger>

                {/* Docs panel*/}
                <Panel collapsible expanded={this.state.open} className='docs-panel-collapsible'>
                    <div className='docs-panel-toolbar'>

                        <div className='docs-panel-toolbar-content'>{this.state.display}</div>

                        {/* Toggle docs panel to show it*/}
                        <ButtonGroup className='docs-panel-toolbar-toggle'>
                            <OverlayTrigger rootClose placement='top' overlay={<Tooltip id='tooltip'>{'Toggle docs toolbar'}</Tooltip>}>
                                <Button onClick={this._togglePanel}> <Icon type={'bt-caret-down'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                    </div>
                </Panel>
            </div>
        );
    }
}
