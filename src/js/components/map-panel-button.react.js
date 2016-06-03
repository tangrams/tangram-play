import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Icon from './icon.react';

export default React.createClass({
    render: function() {
        return (
            <Button onClick={this.togglePanel}>
              <Icon type={'bt-globe'} />
            </Button>
        );
    },
    getInitialState: function() {
        return {
            toggle: true
        };
    },
    togglePanel: function() {
        this.setState({
            toggle: !this.state.toggle
        });
        console.log(this.state.toggle) ;
    }
});
