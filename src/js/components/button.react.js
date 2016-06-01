import React from 'react';
import EditorIO from '../editor/io';

export default React.createClass({
    render: function() {
        return (
                <li className={`menu-item ${ this.props.uiclass }`} data-tooltip={this.props.tooltip} onClick={this.handleClick}>
                    <i className='btm bt-file'></i>
                    <span className='menu-item-label'>{this.props.name}</span>
                </li>
        );
    },
    handleClick: function() {
        if(this.props.type === 'new') {
            this.newClick() ;
        }
        else if (this.props.type === 'open') {
            this.openClick() ;
        }
        else if (this.props.type === 'save') {
            this.saveClick() ;
        }
    },
    newClick: function() {
        console.log("clicked") ;
        EditorIO.new();
        _resetTooltipState();
    },
    openClick: function() {
        let menuEl = document.body.querySelector('.menu-dropdown-open');
        let posX = document.body.querySelector('.menu-button-open').getBoundingClientRect().left;
        menuEl.style.left = posX + 'px';
        menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
        if (menuEl.style.display === 'none') {
            _resetTooltipState();
        }
        window.addEventListener('click', _onClickOutsideDropdown, false);
    },
    saveClick: function() {
        let menuEl = document.body.querySelector('.menu-dropdown-save');
        let posX = document.body.querySelector('.menu-button-save').getBoundingClientRect().left;
        menuEl.style.left = posX + 'px';
        menuEl.style.display = (menuEl.style.display === 'block') ? 'none' : 'block';
        if (menuEl.style.display === 'none') {
            _resetTooltipState();
        }
        window.addEventListener('click', _onClickOutsideDropdown, false);
    }
});

function _resetTooltipState () {
    let items = document.querySelectorAll('.menu-item');
    for (let el of items) {
        el.removeAttribute('data-tooltip-state');
    }
}
