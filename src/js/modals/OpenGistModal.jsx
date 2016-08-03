import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/icon.react';

import TangramPlay from '../tangram-play';
import ErrorModal from './ErrorModal';
import LocalStorage from '../storage/localstorage';
import { getSceneURLFromGistAPI } from '../tools/gist-url';

const STORAGE_SAVED_GISTS = 'gists';

export default class OpenGistModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            gists: null,
            selected: null
        };

        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentWillMount () {
        // Always load new set of saved Gists from memory each
        // time this modal is opened, in case it has changed
        // during use
        // Gists are currently stored in LocalStorage
        const gists = JSON.parse(LocalStorage.getItem(STORAGE_SAVED_GISTS));

        if (gists && gists.arr) {
            // Reverse-sort the gists; most recent will display up top
            _.reverse(gists.arr);
        }

        this.setState({
            gists: gists
        });
    }

    onClickCancel () {
        ReactDOM.unmountComponentAtNode(document.getElementById('modal-container'));
    }

    onClickConfirm () {
        if (this.state.selected) {
            this.onClickCancel(); // to close modal
            TangramPlay.load({ url: this.state.selected });

            getSceneURLFromGistAPI(this.state.selected)
                .then((url) => {
                    TangramPlay.load({ url });
                })
                .catch((error) => {
                    this.handleError(error, this.state.selected);
                });
        }
    }

    /**
     * If opening a URL is not successful
     *
     * @param {Error} error - thrown by something else
     *    if error.message is a number, then it is a status code from Fetch
     *    but status code numbers are converted to strings
     *    there must be a better way of doing this
     * @param {string} url - the Gist URL that was attempted
     */
    handleError (error, value) {
        // Close the modal
        this.onClickCancel();

        let message = '';

        if (error.message === '404') {
            message = 'This Gist could not be found.';
        }
        else if (error.message === '403') {
            message = 'We exceeded the rate limit for GitHub’s non-authenticated request API.';
        }
        else if (Number.isInteger(window.parseInt(error.message, 10))) {
            message = `The Gist server gave us an error code of ${error.message}`;
        }

        // Show error modal
        ReactDOM.render(<ErrorModal error={`Could not load the Gist! ${message}`} />, document.getElementById('modal-container'));

        if (error.message === '404') {
            removeNonexistentGistFromLocalStorage(value);
        }
    }

    render () {
        const gists = this.state.gists;

        let gistList;

        if (!gists || !gists.arr || gists.arr.length === 0) {
            gistList = 'No gists have been saved!';
        }
        else {
            gistList = gists.arr.map((item, index) => {
                // We have two types of things in this array.
                // LEGACY: it's just a string for the gist URL.
                // CURRENT: an object that has information in it.
                // We'll try to JSON.parse the item first; if it works,
                // then we can create a new entry for it. Otherwise,
                // fallback to the string-only url.
                let isLegacy = false;
                try {
                    item = JSON.parse(item);
                }
                // Not JSON-parseable; LEGACY gist url format.
                catch (e) {
                    isLegacy = true;
                }

                // If the scene is selected, a special class is applied later to it
                let classString = 'open-gist-option';

                if (isLegacy === false) {
                    // TODO: don't hardcode
                    const descPlaceholder = '[This is a Tangram scene, made with Tangram Play.]';

                    item.description = item.description.replace(descPlaceholder, '');
                    if (item.description.length === 0) {
                        item.description = 'No description provided.';
                    }

                    if (this.state.selected === item.url) {
                        classString += ' open-gist-selected';
                    }

                    // TODO:
                    // There is actually a lot more info stored than is currently being
                    // displayed. We have date, user, public gist or not, and map view.
                    return (
                        <div
                            className={classString}
                            key={index}
                            data-url={item.url}
                            onClick={() => { this.setState({ selected: item.url }); }}
                            onDoubleClick={this.onClickConfirm}
                        >
                            <div className='open-gist-option-thumbnail'>
                                <img src={item.thumbnail} />
                            </div>
                            <div className='open-gist-option-info'>
                                <div className='open-gist-option-name'>
                                    {item.name}
                                </div>
                                <div className='open-gist-option-description'>
                                    {item.description}
                                </div>
                                <div className='open-gist-option-date'>
                                    {/* Show the date this was saved.
                                        TODO: better formatting;
                                        maybe use moment.js */}
                                    Saved on {new Date(item['created_at']).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    );
                }
                else {
                    if (this.state.selected === item) {
                        classString += ' open-gist-selected';
                    }

                    return (
                        <div
                            className={classString}
                            key={index}
                            data-url={item}
                            onClick={() => { this.setState({ selected: item }); }}
                            onDoubleClick={this.onClickConfirm}
                        >
                            <div className='open-gist-option-legacy-name'>
                                {item}
                            </div>
                        </div>
                    );
                }
            });
        }

        // Render the entire modal
        return (
            <Modal className='modal-alt open-gist-modal'>
                <h4>Open a previously saved Gist</h4>

                <div className='modal-content open-gist-list'>
                    {gistList}
                </div>

                <div className='modal-buttons'>
                    <Button onClick={this.onClickCancel} className='modal-cancel'>
                        <Icon type={'bt-times'} /> Cancel
                    </Button>
                    <Button
                        onClick={this.onClickConfirm}
                        className='modal-confirm'
                        disabled={this.state.selected === null}
                    >
                        <Icon type={'bt-check'} /> Open
                    </Button>
                </div>
            </Modal>
        );
    }
}

/**
 * Utility function for removing gists that match a url string.
 *
 * @param {string} url - the Gist to remove
 */
function removeNonexistentGistFromLocalStorage (url) {
    const gists = JSON.parse(LocalStorage.getItem(STORAGE_SAVED_GISTS));

    // Filter the unfound gist URL from the gist list
    gists.arr = _.reject(gists.arr, (item) => {
        // Each item in the array is a string. Instead of checking whether
        // the string is JSON-parsable, however, we'll assume that if any part
        // of the string contains the url, then we can reject that item.
        return new RegExp(url).test(item);
    });

    LocalStorage.setItem(STORAGE_SAVED_GISTS, JSON.stringify(gists));
}
