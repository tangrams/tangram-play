import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Icon from './Icon';

export default class PanelCloseButton extends React.Component {
    render () {
        return (
            <Button onClick={this.props.onClick} className='widget-exit'>
                <Icon type={'bt-times'} />
            </Button>
        );
    }
}

PanelCloseButton.propTypes = {
    onClick: React.PropTypes.func
};
