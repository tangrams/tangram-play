import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

// import localforage from 'localforage';
import ErrorModal from './ErrorModal';
import SaveGistSuccessModal from './SaveGistSuccessModal';
import { saveToMapzenUserAccount } from '../storage/mapzen';
import { editor } from '../editor/editor';
// import { replaceHistoryState } from '../tools/url-state';

// Default values in UI
const DEFAULT_GIST_SCENE_NAME = 'Tangram scene';
const DEFAULT_GIST_SCENE_FILENAME = 'scene.yaml';
const DEFAULT_GIST_DESCRIPTION = 'This is a Tangram scene, made with Tangram Play.';

// const STORAGE_SAVED_GISTS = 'gists';
const SAVE_TIMEOUT = 20000; // ms before we assume saving is failure

export default class SaveGistModal extends React.Component {
    constructor (props) {
        super(props);

        this._timeout = null;

        this.state = {
            thinking: false
        };

        this.onClickConfirm = this.onClickConfirm.bind(this);
        this.onClickCancel = this.onClickCancel.bind(this);
        this.setReadyUI = this.setReadyUI.bind(this);
        this.handleSaveSuccess = this.handleSaveSuccess.bind(this);
        this.handleSaveError = this.handleSaveError.bind(this);
    }

    componentDidMount () {
        this.setReadyUI();
    }

    componentWillReceiveProps (nextState, nextProps) {
        if (nextProps.visible === true) {
            this.setReadyUI();
        }
    }

    componentWillUnmount () {
        window.clearTimeout(this._timeout);
    }

    onClickConfirm () {
        // Waiting state
        this.setState({
            thinking: true
        });

        // Name of the scene
        let sceneName = this.nameInput.value;
        if (sceneName.length === 0) {
            sceneName = DEFAULT_GIST_SCENE_NAME;
        }

        // Filename
        // Currently, set it to default value.
        // We will re-address filenames in multi-tab scenario.
        let filename = DEFAULT_GIST_SCENE_FILENAME;

        // Description is either set to default (if blank)
        // or appended to the user-produced value
        let description;
        if (this.descriptionInput.value.length === 0 || this.descriptionInput.value.trim() === DEFAULT_GIST_DESCRIPTION) {
            description = `[${DEFAULT_GIST_DESCRIPTION}]`;
        }
        else {
            // Newlines are not accepted on gist descriptions, apparently.
            description = this.descriptionInput.value + ` [${DEFAULT_GIST_DESCRIPTION}]`;
        }

        const data = {
            sceneName,
            filename,
            description,
            isPublic: this.publicCheckbox.checked
        };

        saveToMapzenUserAccount(data)
            .then(this.handleSaveSuccess)
            .catch(this.handleSaveError);

        // Start save timeout
        // TODO: This does not cancel the request if it is in progress
        this._timeout = window.setTimeout(() => {
            this.handleSaveError({ message: 'GitHub’s servers haven’t responded in a while, so we’re going stop waiting for them. You might want to try again later!' });
        }, SAVE_TIMEOUT);
    }

    onClickCancel (event) {
        window.clearTimeout(this._timeout);
        this.resetInputs();
        this.component.unmount();
    }

    setReadyUI () {
        // Put the cursor on 'Scene name'
        this.nameInput.focus();
        this.nameInput.select();
    }

    /**
     * Called when modal is canceled or save is aborted.
     * This resets the inputs to its initial state.
     * Do not call this if save is successful. This is because
     * a user might want to have follow up saves where the same
     * settings might be used.
     */
    resetInputs () {
        this.descriptionInput.value = DEFAULT_GIST_DESCRIPTION;
        this.descriptionInput.blur();
        this.nameInput.value = DEFAULT_GIST_SCENE_NAME;
        this.nameInput.blur();
        this.publicCheckbox.checked = true;
        this.publicCheckbox.blur();
    }

    // If successful, turn off wait state,
    // mark as clean state in the editor,
    // remember the success response,
    // and display a helpful message
    handleSaveSuccess (data) {
        // const gist = data.gist;
        console.log('handleSaveSuccess', data);

        // Create storage object
        // const saveData = {
        //     name: data.metadata.name,
        //     description: data.gist.description,
        //     view: data.metadata.view,
        //     user: data.gist.user,
        //     url: data.gist.url,
        //     public: data.gist.public,
        //     /* eslint-disable camelcase */
        //     created_at: data.gist.created_at,
        //     updated_at: data.gist.updated_at,
        //     /* eslint-enable camelcase */
        //     thumbnail: data.thumbnail
        // };

        // Store response in localstorage
        // This is stored as an array of saveData
        // localforage.getItem(STORAGE_SAVED_GISTS)
        //     .then((gists) => {
        //         if (Array.isArray(gists)) {
        //             gists.push(saveData);
        //         }
        //         else {
        //             gists = [];
        //         }
        //         localforage.setItem(STORAGE_SAVED_GISTS, gists);
        //     });

        // Close the modal
        this.component.unmount();

        // Mark as clean state in the editor
        editor.doc.markClean();

        // Update the page URL. The scene parameter should
        // reflect the new scene URL.
        // replaceHistoryState({ scene: gist.url });

        // Show success modal
        // TODO
        ReactDOM.render(<SaveGistSuccessModal urlValue='hey it worked' />, document.getElementById('modal-container'));
    }

    /**
     * If opening a URL is not successful, turn off wait state,
     * and display the error message.
     *
     * @param {Error} Thrown by something else
     */
    handleSaveError (error) {
        // Close the modal
        this.component.unmount();

        // Show error modal
        ReactDOM.render(<ErrorModal error={`Uh oh! We tried to save your scene but something went wrong. ${error.message}`} />, document.getElementById('modal-container'));
    }

    render () {
        return (
            /* Modal disableEsc is true if we are waiting for a response */
            <Modal
                className='modal-alt save-gist-modal'
                disableEsc={this.state.thinking}
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickCancel}
            >
                <div className='modal-text modal-save-gist-text'>
                    <h4>Save this scene to gist</h4>
                    <p>
                        This saves your Tangram scene as an anonymous gist on GitHub, so you'll have a permanent link to share publicly. Don’t lose this URL! <a href='https://help.github.com/articles/about-gists/' target='_blank'>Learn more about anonymous gists</a>.
                    </p>
                </div>

                <hr />

                <div className='modal-content'>
                    <label htmlFor='gist-name'>Scene name</label>
                    <input
                        type='text'
                        id='gist-name'
                        ref={(ref) => { this.nameInput = ref; }}
                        placeholder='(default: Tangram scene)'
                        defaultValue={DEFAULT_GIST_SCENE_NAME}
                    />
                    <p>
                        <label htmlFor='gist-description'>Scene description</label>
                        <input
                            type='text'
                            id='gist-description'
                            ref={(ref) => { this.descriptionInput = ref; }}
                            placeholder='(optional description)'
                            defaultValue={DEFAULT_GIST_DESCRIPTION}
                        />
                    </p>
                    <p>
                        <label htmlFor='gist-public'>Public gist</label>
                        <input
                            type='checkbox'
                            id='gist-public'
                            ref={(ref) => { this.publicCheckbox = ref; }}
                            defaultChecked
                            style={{ marginLeft: '0.5em' }}
                        />
                    </p>
                </div>

                <div className='modal-buttons'>
                    <LoadingSpinner on={this.state.thinking} />
                    <Button
                        className='modal-cancel'
                        disabled={this.state.thinking}
                        onClick={this.onClickCancel}
                    >
                        <Icon type={'bt-times'} /> Cancel
                    </Button>
                    <Button
                        className='modal-confirm'
                        disabled={this.state.thinking}
                        onClick={this.onClickConfirm}
                    >
                        <Icon type={'bt-check'} /> Save to gist
                    </Button>
                </div>
            </Modal>
        );
    }
}
