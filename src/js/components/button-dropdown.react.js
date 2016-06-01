import React from 'react';

export default React.createClass({
    getInitialState: function() {
        return {
            listVisible: false
        };
    },

    select: function(item) {
        this.props.selected = item;
    },

    show: function() {
        this.setState({ listVisible: true });
        document.addEventListener("click", this.hide);
    },

    hide: function() {
        this.setState({ listVisible: false });
        document.removeEventListener("click", this.hide);
    },

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

    saveClick: function() {
        this.show() ;
        console.log("clicking on save") ;
    }
    /*
    render: function() {
        return <div className={"dropdown-container" + (this.state.listVisible ? " show" : "")}>
            <div className={"dropdown-display" + (this.state.listVisible ? " clicked": "")} onClick={this.show}>
                <span style={{ color: this.props.selected.hex }}>{this.props.selected.name}</span>
                <i className="fa fa-angle-down"></i>
            </div>
            <div className="dropdown-list">
                <div>
                    {this.renderListItems()}
                </div>
            </div>
        </div>;
    },
    */
    /*
    renderListItems: function() {
        var items = [];
        for (var i = 0; i < this.props.list.length; i++) {
            var item = this.props.list[i];
            items.push(<div onClick={this.select.bind(null, item)}>
                <span style={{ color: item.hex }}>{item.name}</span>
            </div>);
        }
        return items;
    }*/
});
