import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Icon from './icon.react';

import bookmarks from '../map/bookmarks';
import { map } from '../map/map';
import Modal from '../modals/modal';
import { EventEmitter } from './event-emitter';

/**
 * Represents the search bar and bookmarks button on the map panel
 */
export default class MapPanelBookmarks extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);

        // Most of the time we don't want to override the bookmark button toggle function
        this.overrideBookmarkClose = false;

        this.state = {
            bookmarks: this.updateBookmarks() // Stores all bookmarks
        };

        this.shouldDropdownToggle = this.shouldDropdownToggle.bind(this);
        this.bookmarksClearedCallback = this.bookmarksClearedCallback.bind(this);
    }

    componentDidMount () {
        // Need a notification when all bookmarks are cleared succesfully in order to re-render list
        EventEmitter.subscribe('bookmarks:clear', this.bookmarksClearedCallback);

        EventEmitter.subscribe('bookmarks:updated', (data) => {
            this.setState({
                bookmarks: this.updateBookmarks()
            });
        });
    }

    /**
     * Official React lifecycle method
     * Invoked immediately after the component's updates are flushed to the DOM
     * Using a ref to the DOM element overlay tooltip on top of the dropdown button
     * to make sure its closed after user clicks on a bookmark
     */
    componentDidUpdate (prevProps, prevState) {
        this.culpritOverlay.hide();
        this.overrideBookmarkClose = false;
    }

    /**
     * Fires when a user clicks on a bookmark from bookmark list.
     * Causes map and search panel to re-render to go to the location on the bookmark
     * @param key - each bookmark in the bookmark list identified by a unique
     *      key
     */
    onClickGoToBookmark (key) {
        const bookmark = this.state.bookmarks[key];

        const coordinates = { lat: bookmark.lat, lng: bookmark.lng };
        const zoom = bookmark.zoom;

        if (!coordinates || !zoom) {
            return;
        }

        map.setView(coordinates, zoom);
        EventEmitter.dispatch('bookmarks:active');
    }

    /**
     * Delete a single bookmark
     * @param key - the bookmark index to delete
     */
    onClickDeleteSingleBookmark (key) {
        this.overrideBookmarkClose = true; // We want to keep the dropdown open
        bookmarks.deleteBookmark(key);
    }

    /**
     * Callback called when dropdown button wants to change state from open to closed
     * @param isOpen - state that dropdown wants to render to. Either true or false
     */
    shouldDropdownToggle (isOpen) {
        if (this.overrideBookmarkClose) {
            return true;
        }
        else {
            return isOpen;
        }
    }

    /**
     * Delete all bookmarks
     */
    onClickDeleteBookmarks () {
        const modal = new Modal('Are you sure you want to clear your bookmarks? This cannot be undone.', bookmarks.clearData);
        modal.show();
    }

    /**
     * Callback issued from 'bookmarks' object in order to update the panel UI.
     * Causes a re-render of the bookmarks list
     */
    bookmarksClearedCallback () {
        this.setState({
            bookmarks: this.updateBookmarks()
        });
        EventEmitter.dispatch('bookmarks:inactive');
    }

    /**
     * Fetches current bookmarks from 'bookmarks' object a causes re-render of
     * bookmarks list.
     */
    updateBookmarks () {
        const newBookmarks = [];
        const bookmarkList = bookmarks.readData().data;

        for (let i = 0; i < bookmarkList.length; i++) {
            const bookmark = bookmarkList[i];
            let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

            newBookmarks.push({
                id: i,
                label: bookmark.label,
                lat: bookmark.lat.toFixed(4),
                lng: bookmark.lng.toFixed(4),
                zoom: fractionalZoom.toFixed(1),
                onClick: this.onClickGoToBookmark.bind(this),
                active: ''
            });
        }

        return newBookmarks;
    }

    render () {
        return (
            <OverlayTrigger
                rootClose
                placement='bottom'
                ref={(ref) => { this.culpritOverlay = ref; }}
                overlay={<Tooltip id='tooltip-bookmark'>{'Bookmarks'}</Tooltip>}
            >
                <DropdownButton
                    title={<Icon type={'bt-bookmark'} />}
                    bsStyle='default'
                    noCaret
                    pullRight
                    className='map-panel-bookmark-button'
                    // The prop 'id' is required to make 'Dropdown' accessible
                    // for users using assistive technologies such as screen readers
                    id='map-panel-bookmark-button'
                    open={this.shouldDropdownToggle()}
                    onToggle={this.shouldDropdownToggle}
                >
                    {/* Define an immediately-invoked function expression
                        inside JSX to decide whether to render full bookmark
                        list or not */}
                    {(() => {
                        let bookmarkDropdownList;

                        // If no bookmarks, then display a no bookmarks message
                        if (this.state.bookmarks.length === 0) {
                            bookmarkDropdownList = (
                                <MenuItem key='none' className='bookmark-dropdown-center'>
                                    <div>No bookmarks yet!</div>
                                </MenuItem>
                            );
                        }
                        // If there are bookmarks
                        else {
                            // Create the bookmarks list
                            const list = this.state.bookmarks.map((result, i) => {
                                return (
                                    <MenuItem key={i}>
                                        <div
                                            className='bookmark-dropdown-info'
                                            onClick={() => this.onClickGoToBookmark(i)}
                                        >
                                            <div className='bookmark-dropdown-icon'>
                                                <Icon type={'bt-map-marker'} />
                                            </div>
                                            <div>
                                                {result.label}
                                                <br />
                                                <span className='bookmark-dropdown-text'>
                                                    {result.lat}, {result.lng}, z{result.zoom}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className='bookmark-dropdown-delete'
                                            onClick={() => this.onClickDeleteSingleBookmark(i)}
                                        >
                                            <Icon type={'bt-times'} />
                                        </div>
                                    </MenuItem>
                                );
                            });

                            // Add a delete button at the end
                            const deletebutton = (
                                <MenuItem
                                    key='delete'
                                    onSelect={this.onClickDeleteBookmarks}
                                    className='bookmark-dropdown-center clear-bookmarks'
                                >
                                    <div>Clear bookmarks</div>
                                </MenuItem>
                            );

                            // In React we have to use arrays if we want to concatenate two JSX fragments
                            bookmarkDropdownList = [list, deletebutton];
                        }

                        return bookmarkDropdownList;
                    })()}
                </DropdownButton>
            </OverlayTrigger>
        );
    }
}
