import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';
import LoadingSpinner from './LoadingSpinner';

import ErrorModal from './ErrorModal';
import SaveToCloudSuccessModal from './SaveToCloudSuccessModal';
import { saveToMapzenUserAccount } from '../storage/mapzen';
import { editor } from '../editor/editor';
import { replaceHistoryState } from '../tools/url-state';

// Default values in UI
const DEFAULT_SCENE_NAME = 'Tangram scene';

const SAVE_TIMEOUT = 20000; // ms before we assume saving is failure

export default class SaveToCloudModal extends React.Component {
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
        let name = this.nameInput.value;
        if (name.length === 0) {
            name = DEFAULT_SCENE_NAME;
        }

        // Description is optional
        // or appended to the user-produced value
        const description = this.descriptionInput.value.trim();

        const data = {
            name,
            description,
            public: this.publicCheckbox.checked
        };

        saveToMapzenUserAccount(data)
            .then(this.handleSaveSuccess)
            .catch(this.handleSaveError);

        // Start save timeout
        // TODO: This does not cancel the request if it is in progress
        // TODO: Test this
        this._timeout = window.setTimeout(() => {
            this.handleSaveError({ message: 'The server haven’t responded in a while, so we’re going stop trying. Please try again later!' });
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
        this.descriptionInput.value = '';
        this.descriptionInput.blur();
        this.nameInput.value = DEFAULT_SCENE_NAME;
        this.nameInput.blur();
        this.publicCheckbox.checked = true;
        this.publicCheckbox.blur();
    }

    // If successful, turn off wait state,
    // mark as clean state in the editor,
    // remember the success response,
    // and display a helpful message
    //
    // `data` is (currently) the object saved to `scenelist.json`
    handleSaveSuccess (data) {
        // Close the modal
        this.component.unmount();

        // Mark as clean state in the editor
        editor.doc.markClean();

        // Update the page URL. The scene parameter should
        // reflect the new scene URL.
        replaceHistoryState({ scene: data.files.scene });

        // Show success modal
        // TODO
        ReactDOM.render(<SaveToCloudSuccessModal urlValue={data.files.scene} />, document.getElementById('modal-container'));
    }

    /**
     * If opening a URL is not successful, turn off wait state,
     * and display the error message.
     *
     * @param {Error} Thrown by something else
     */
    handleSaveError (error) {
        // Close the modal, if present
        if (this.component) {
            this.component.unmount();
        }

        // Show error modal
        ReactDOM.render(<ErrorModal error={`Uh oh! We tried to save your scene but something went wrong. ${error.message}`} />, document.getElementById('modal-container'));
    }

    render () {
        return (
            /* Modal disableEsc is true if we are waiting for a response */
            <Modal
                className='modal-alt save-to-cloud-modal'
                disableEsc={this.state.thinking}
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickCancel}
            >
                <div className='modal-text'>
                    <h4>Save this scene to your Mapzen account</h4>
                    <p>
                        This uploads your Tangram scene file to your Mapzen account, so you'll have a permanent link to share publicly.
                    </p>
                </div>

                <hr />

                <div className='modal-content'>
                    <label htmlFor='save-scene-name'>Scene name</label>
                    <input
                        type='text'
                        id='save-scene-name'
                        ref={(ref) => { this.nameInput = ref; }}
                        placeholder='(default: Tangram scene)'
                        defaultValue={DEFAULT_SCENE_NAME}
                    />
                    <p>
                        <label htmlFor='save-scene-description'>Scene description</label>
                        <input
                            type='text'
                            id='save-scene-description'
                            ref={(ref) => { this.descriptionInput = ref; }}
                            placeholder='(optional description)'
                        />
                    </p>
                    <p>
                        <label htmlFor='save-scene-public'>Public gist</label>
                        <input
                            type='checkbox'
                            id='save-scene-public'
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
                        <Icon type={'bt-check'} /> Save
                    </Button>
                </div>
            </Modal>
        );
    }
}
