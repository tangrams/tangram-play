import React from 'react';

export default class PanelCloseButton extends React.Component {
    render () {
        return <div className='panel-close-glyph' onClick={this.props.onClick}>×</div>;
    }
}

PanelCloseButton.propTypes = {
    onClick: React.PropTypes.func
};
