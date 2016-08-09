import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import Draggable from 'react-draggable';

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

        const INITIAL_HEIGHT = 50;
        this.MIN_HEIGHT = 50;

        this.state = {
            open: true, // Whether panel should be open or not
            display: '',
            height: INITIAL_HEIGHT
        };

        this.lastSavedHeight = INITIAL_HEIGHT;

        this.openPanel = this.openPanel.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.closePanel = this.closePanel.bind(this);
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
    openPanel () {
        this.setState({ height: this.lastSavedHeight });
    }

    closePanel () {
        this.lastSavedHeight = this.state.height;

        this.setState({
            height: 0
        });
    }

    onDrag (e, ui) {
        let delta = this.state.height - (ui.y);

        if (delta < this.MIN_HEIGHT) {
            delta = this.MIN_HEIGHT;
        }

        // Add a little more height at the bottom, so if the drag is fast you can't see any slip
        this.setState({
            height: delta
        });
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        var divStyle = {
            height: this.state.height + 'px'
        };

        return (
            <div>
                {/* Toggle docs panel to show it*/}
                <OverlayTrigger rootClose placement='top' overlay={<Tooltip id='tooltip'>{'Open docs toolbar'}</Tooltip>}>
                    <Button onClick={this.openPanel} className='docs-panel-button-show'>
                        <Icon type={'bt-caret-up'} />
                    </Button>
                </OverlayTrigger>

                {/* Docs panel*/}
                <Draggable axis='y' onDrag={this.onDrag}>
                    <Panel className='docs-panel-collapsible' style={divStyle}>
                        <div className='docs-panel-toolbar' >

                            <div className='docs-panel-toolbar-content'>{this.state.display}</div>

                            {/* Toggle docs panel to show it*/}
                            <ButtonGroup className='docs-panel-toolbar-toggle'>
                                <OverlayTrigger rootClose placement='top' overlay={<Tooltip id='tooltip'>{'Close docs toolbar'}</Tooltip>}>
                                    <Button onClick={this.closePanel}> <Icon type={'bt-caret-down'} /> </Button>
                                </OverlayTrigger>
                            </ButtonGroup>

                        </div>
                    </Panel>
                </Draggable>

            </div>
        );
    }
}
