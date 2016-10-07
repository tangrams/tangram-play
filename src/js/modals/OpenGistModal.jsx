import { reverse, reject } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import localforage from 'localforage';

import Modal from './Modal';
import Icon from '../components/Icon';
import ErrorModal from './ErrorModal';
import { load } from '../tangram-play';
import { getSceneURLFromGistAPI } from '../tools/gist-url';

const STORAGE_SAVED_GISTS = 'gists';

/**
 * Utility function for removing gists that match a url string.
 *
 * @param {string} url - the Gist to remove
 */
function removeNonexistentGistFromLocalStorage(url) {
    localforage.getItem(STORAGE_SAVED_GISTS)
        .then((gists) => {
            // Filter the unfound gist URL from the gist list
            const data = reject(gists, (item) => url === item.url);
            localforage.setItem(STORAGE_SAVED_GISTS, data);
        });
}

export default class OpenGistModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false,
            gists: [],
            selected: null,
        };

        this.onClickCancel = this.onClickCancel.bind(this);
        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentWillMount() {
        // Always load new set of saved Gists from memory each
        // time this modal is opened, in case it has changed
        // during use
        // Gists are currently stored via localforage
        localforage.getItem(STORAGE_SAVED_GISTS)
            .then((gists) => {
                if (Array.isArray(gists)) {
                    // NOTE:
                    // string-only gists urls are migrated anyway;
                    // we'll skip these for now, filter them out
                    const data = reject(gists, (item) => typeof item === 'string');

                    // Reverse-sort the gists; most recent will display up top
                    // Note this mutates the original array.
                    reverse(data);

                    this.setState({
                        loaded: true,
                        gists: data,
                    });
                } else {
                    this.setState({
                        loaded: true,
                    });
                }
            });
    }

    onClickCancel() {
        this.component.unmount();
    }

    onClickConfirm() {
        if (this.state.selected) {
            this.onClickCancel(); // to close modal

            getSceneURLFromGistAPI(this.state.selected)
                .then((url) => {
                    load({ url });
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
    handleError(error, value) {
        // Close the modal, if still present
        if (this.component) {
            this.onClickCancel();
        }

        let message = '';

        if (error.message === '404') {
            message = 'This Gist could not be found.';
        } else if (error.message === '403') {
            message = 'We exceeded the rate limit for GitHub’s non-authenticated request API.';
        } else if (Number.isInteger(window.parseInt(error.message, 10))) {
            message = `The Gist server gave us an error code of ${error.message}`;
        }

        // Show error modal
        ReactDOM.render(
            <ErrorModal error={`Could not load the Gist! ${message}`} />,
            document.getElementById('modal-container')
        );

        if (error.message === '404') {
            removeNonexistentGistFromLocalStorage(value);
        }
    }

    render() {
        const gists = this.state.gists;

        let gistList;

        if (this.state.loaded === true && gists.length === 0) {
            gistList = 'No gists have been saved!';
        } else {
            gistList = gists.map((item, index) => {
                // If the scene is selected, a special class is applied later to it
                let classString = 'open-from-cloud-option';

                // TODO: Do not hardcode.
                const descPlaceholder = '[This is a Tangram scene, made with Tangram Play.]';

                if (item.description) {
                    item.description = item.description.replace(descPlaceholder, '');
                }
                if (!item.description || item.description.length === 0) {
                    item.description = 'No description provided.';
                }

                if (this.state.selected === item.url) {
                    classString += ' open-from-cloud-selected';
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
                        <div className="open-from-cloud-option-thumbnail">
                            <img src={item.thumbnail} role="presentation" />
                        </div>
                        <div className="open-from-cloud-option-info">
                            <div className="open-from-cloud-option-name">
                                {item.name}
                            </div>
                            <div className="open-from-cloud-option-description">
                                {item.description}
                            </div>
                            <div className="open-from-cloud-option-date">
                                {/* Show the date this was saved.
                                    TODO: better formatting;
                                    maybe use moment.js */}
                                Saved on {new Date(item.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                );
            });
        }

        // Render the entire modal
        return (
            <Modal
                className="modal-alt open-from-cloud-modal"
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickClose}
            >
                <h4>Open a previously saved Gist</h4>

                <div className="modal-content modal-well open-from-cloud-list">
                    {gistList}
                </div>

                <div className="modal-buttons">
                    <Button onClick={this.onClickCancel} className="button-cancel">
                        <Icon type="bt-times" /> Cancel
                    </Button>
                    <Button
                        onClick={this.onClickConfirm}
                        className="button-confirm"
                        disabled={this.state.selected === null}
                    >
                        <Icon type="bt-check" /> Open
                    </Button>
                </div>
            </Modal>
        );
    }
}
