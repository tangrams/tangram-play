import React from 'react';
import ReactDOM from 'react-dom';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Icon from './Icon';
import ConfirmDialogModal from '../modals/ConfirmDialogModal';

import { getLocationBookmarks, clearLocationBookmarks, deleteLocationBookmark } from '../map/bookmarks';
import { map } from '../map/map';
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
            bookmarks: null // We will fill this in during `componentWillMount`
        };

        this.onClickDeleteBookmarks = this.onClickDeleteBookmarks.bind(this);
        this.onClickConfirmClearAllBookmarks = this.onClickConfirmClearAllBookmarks.bind(this);
        this.updateBookmarks = this.updateBookmarks.bind(this);
        this.shouldDropdownToggle = this.shouldDropdownToggle.bind(this);
    }

    componentWillMount () {
        // Get bookmarks from localstorage.
        getLocationBookmarks().then(this.updateBookmarks);
    }

    componentDidMount () {
        // Listen for changes to bookmarks from other components
        EventEmitter.subscribe('bookmarks:updated', this.updateBookmarks);
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
     *
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

        // Activates highlighted state on the location bar
        EventEmitter.dispatch('bookmarks:active');
    }

    /**
     * Delete a single bookmark. Use a guaranteed unique ID to find the correct
     * bookmark to delete. Using React's key position from the render loop
     * is not reliable since it may not be in sync with the current state of data.
     *
     * @param uid - the unique ID of the bookmark to delete
     */
    onClickDeleteSingleBookmark (uid) {
        this.overrideBookmarkClose = true; // We want to keep the dropdown open

        deleteLocationBookmark(uid)
            .then(this.updateBookmarks)
            .then(() => {
                // Removes a highlighted state on the location bar, if any
                EventEmitter.dispatch('bookmarks:inactive');
            });
    }

    /**
     * Clears all current bookmarks.
     */
    onClickConfirmClearAllBookmarks () {
        clearLocationBookmarks()
            .then(this.updateBookmarks)
            .then(() => {
                // Removes a highlighted state on the location bar, if any
                EventEmitter.dispatch('bookmarks:inactive');
            });
    }

    /**
     * Callback called when dropdown button wants to change state from open to closed
     *
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
        ReactDOM.render(
            <ConfirmDialogModal
                message='Are you sure you want to clear your bookmarks? This cannot be undone.'
                confirmCallback={this.onClickConfirmClearAllBookmarks}
            />,
            document.getElementById('modal-container')
        );
    }

    /**
     * Given new bookmarks object from store, convert to state object and
     * trigger a re-render of bookmarks list.
     */
    updateBookmarks (bookmarks) {
        const newBookmarks = [];

        for (let i = 0; i < bookmarks.length; i++) {
            const bookmark = bookmarks[i];
            let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

            newBookmarks.push({
                id: i,
                _date: bookmark._date,
                label: bookmark.label,
                lat: bookmark.lat.toFixed(4),
                lng: bookmark.lng.toFixed(4),
                zoom: fractionalZoom.toFixed(1),
                onClick: this.onClickGoToBookmark.bind(this),
                active: ''
            });
        }

        this.setState({
            bookmarks: newBookmarks
        });
    }

    render () {
        return (
            <OverlayTrigger
                rootClose
                placement='bottom'
                ref={(ref) => { this.culpritOverlay = ref; }}
                overlay={<Tooltip id='tooltip-bookmark'>{'Locations'}</Tooltip>}
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

                        // Haven't loaded bookmarks yet
                        if (this.state.bookmarks === null) {
                            return null;
                        }

                        // If no bookmarks, then display a no bookmarks message
                        if (this.state.bookmarks.length === 0) {
                            bookmarkDropdownList = (
                                <MenuItem key='none' className='bookmark-dropdown-center'>
                                    No locations bookmarked!
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
                                            onClick={() => this.onClickDeleteSingleBookmark(result._date)}
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
                                    className='bookmark-dropdown-center bookmark-dropdown-clear'
                                >
                                    Clear bookmarks
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
