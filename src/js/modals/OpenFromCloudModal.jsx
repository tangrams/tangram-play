import { reverse, sortBy } from 'lodash';
import React from 'react';
import Button from 'react-bootstrap/lib/Button';

import Modal from './Modal';
import Icon from '../components/Icon';
import { showErrorModal } from './ErrorModal';
import { fetchSceneList } from '../storage/mapzen';
import { load } from '../tangram-play';

export default class OpenFromCloudModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false,
            scenes: [],
            selected: null,
        };

        this.onClickCancel = this.onClickCancel.bind(this);
        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentWillMount() {
        // Always load new set of saved scenes from the cloud each
        // time this modal is opened, in case it has changed
        fetchSceneList()
            .then(sceneList => {
                // Sort the scene list by the most recent up top
                // Note this mutates the original array.
                const scenes = reverse(sortBy(sceneList, 'updated_at'));

                this.setState({
                    loaded: true,
                    scenes,
                });
            });
    }

    onClickCancel() {
        this.component.unmount();
    }

    onClickConfirm() {
        if (this.state.selected) {
            this.onClickCancel(); // to close modal
            load({ url: this.state.selected.entrypoint_url });
        }
    }

    /**
     * If opening a URL is not successful
     * TODO: figure out what happens here.
     */
    handleError(error, value) {
        // Close the modal
        this.onClickCancel();

        showErrorModal(`Could not load the scene! ${error.message}`);
    }

    render() {
        const scenes = this.state.scenes;
        const noScenesMsg = 'No scenes have been saved!';

        let sceneList = scenes.map((item, index) => {
            // If the scene is selected, a special class is applied later to it
            let classString = 'open-from-cloud-option';

            if (this.state.selected && this.state.selected.id === item.id) {
                classString += ' open-from-cloud-selected';
            }

            // TODO:
            // There is actually a lot more info stored than is currently being
            // displayed. We have date, user, public or not, and map view.
            return (
                <div
                    className={classString}
                    key={item.id}
                    onClick={() => { this.setState({ selected: item }); }}
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
                            {item.description || 'No description provided.'}
                        </div>
                        <div className="open-from-cloud-option-date">
                            {/* Show the date this was saved.
                                TODO: better formatting;
                                maybe use moment.js */}
                            Saved on {new Date(item.updated_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            );
        });

        // If, after parsing scenes, nothing is there, display message.
        if (this.state.loaded === true && sceneList.length === 0) {
            sceneList = noScenesMsg;
        }

        // Render the entire modal
        return (
            <Modal
                className="modal-alt open-from-cloud-modal"
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickClose}
            >
                <h4>Open a saved scene from your Mapzen account</h4>

                <div className="modal-content modal-well open-from-cloud-list">
                    {sceneList}
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
