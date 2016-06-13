import React from 'react';

import Button from 'react-bootstrap/lib/Button';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';

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
                <Button onClick={ ()=> this.setState({ open: !this.state.open })} id='map-panel-button'>
                    <Icon type={'bt-caret-down'} />
                </Button>

                <Panel collapsible expanded={this.state.open} id='map-panel-toolbar'>
                    <div id='map-toolbar-test'>
                        <div class='map-zoom-indicator'>z&#8202;<span class='map-zoom-quantity'></span></div>
                        <ButtonGroup id="plus-minus">
                            <Button> <Icon type={'bt-plus'} /> </Button>
                            <Button> <Icon type={'bt-minus'} /> </Button>
                        </ButtonGroup>

                        <ButtonGroup id="test-2">
                            <Button> <Icon type={'bt-search'} /> </Button>
                            <input className='map-search-input' placeholder='Cuartos, Mexico' spellcheck='false'></input>
                            <Button> <Icon type={'bt-star'} /> </Button>
                        </ButtonGroup>

                        <ButtonGroup>
                            <Button> <Icon type={'bt-bookmark'} /> </Button>
                        </ButtonGroup>

                        <ButtonGroup>
                            <Button> <Icon type={'bt-map-arrow'} /> </Button>
                        </ButtonGroup>

                        <ButtonGroup>
                            <Button onClick={ ()=> this.setState({ open: !this.state.open })}>
                                <Icon type={'bt-caret-up'} />
                            </Button>
                        </ButtonGroup>
                    </div>
                </Panel>
            </div>
        );
    }
}
