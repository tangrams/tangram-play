import React from 'react';

import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './icon.react';

export default class MapPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        };
    }

    render() {
        return (
            <div>
                {/*Toggle map panel to show it*/}
                <Button onClick={ ()=> this.setState({ open: !this.state.open })} className='map-panel-button-show'>
                    <Icon type={'bt-caret-down'} />
                </Button>

                {/*Map panel*/}
                <Panel collapsible expanded={this.state.open} className='map-panel-collapsible'>
                    <div className='map-panel-toolbar'>
                        <div class='map-zoom-indicator'>z&#8202;<span class='map-zoom-quantity'></span></div>

                        {/*Zoom buttons*/}
                        <ButtonGroup id="buttons-plusminus">
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom in'}</Tooltip>}>
                                <Button> <Icon type={'bt-plus'} /> </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Zoom out'}</Tooltip>}>
                                <Button> <Icon type={'bt-minus'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/*Search buttons*/}
                        <ButtonGroup id="buttons-search">
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Search for a location'}</Tooltip>}>
                                <Button> <Icon type={'bt-search'} /> </Button>
                            </OverlayTrigger>
                            <input className='map-panel-search-input' placeholder='Cuartos, Mexico' spellcheck='false'></input>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmark location'}</Tooltip>}>
                                <Button> <Icon type={'bt-star'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/*Bookmark button*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Bookmarks'}</Tooltip>}>
                                <Button> <Icon type={'bt-bookmark'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/*Locate me button*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Locate me'}</Tooltip>}>
                                <Button> <Icon type={'bt-map-arrow'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {/*Toggle map panel to show it*/}
                        <ButtonGroup>
                            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>{'Toggle map toolbar'}</Tooltip>}>
                                <Button onClick={ ()=> this.setState({ open: !this.state.open })}> <Icon type={'bt-caret-up'} /> </Button>
                            </OverlayTrigger>
                        </ButtonGroup>
                    </div>
                </Panel>
            </div>
        );
    }
}
