import { reverse, sortBy } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';

import { load } from '../tangram-play';
import ErrorModal from './ErrorModal';
import { fetchSceneList } from '../storage/mapzen';

export default class OpenFromCloudModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            loaded: false,
            scenes: [],
            selected: null
        };

        this.onClickCancel = this.onClickCancel.bind(this);
        this.onClickConfirm = this.onClickConfirm.bind(this);
    }

    componentWillMount () {
        // Always load new set of saved scenes from the cloud each
        // time this modal is opened, in case it has changed
        fetchSceneList()
            .then((sceneList) => {
                // Sort the scene list by the most recent up top
                // Note this mutates the original array.
                const scenes = reverse(sortBy(sceneList, 'timestamp'));

                this.setState({
                    loaded: true,
                    scenes: scenes
                });
            });
    }

    onClickCancel () {
        this.component.unmount();
    }

    onClickConfirm () {
        if (this.state.selected) {
            this.onClickCancel(); // to close modal
            load({ url: this.state.selected });
        }
    }

    /**
     * If opening a URL is not successful
     * TODO: figure out what happens here.
     */
    handleError (error, value) {
        // Close the modal
        this.onClickCancel();

        // Show error modal
        ReactDOM.render(<ErrorModal error={`Could not load the scene! ${error.message}`} />, document.getElementById('modal-container'));
    }

    render () {
        let scenes = this.state.scenes;

        let sceneList;

        if (this.state.loaded === true && scenes.length === 0) {
            sceneList = 'No scenes have been saved!';
        }
        else {
            sceneList = scenes.map((item, index) => {
                // If the scene is selected, a special class is applied later to it
                let classString = 'open-from-cloud-option';

                // Placeholder text for no description.
                if (item.description.length === 0) {
                    item.description = 'No description provided.';
                }

                if (this.state.selected === item.url) {
                    classString += ' open-from-cloud-selected';
                }

                // TODO:
                // There is actually a lot more info stored than is currently being
                // displayed. We have date, user, public or not, and map view.
                return (
                    <div
                        className={classString}
                        key={index}
                        data-url={item.files.scene}
                        onClick={() => { this.setState({ selected: item.files.scene }); }}
                        onDoubleClick={this.onClickConfirm}
                    >
                        <div className='open-from-cloud-option-thumbnail'>
                            <img src={item.files.thumbnail} />
                        </div>
                        <div className='open-from-cloud-option-info'>
                            <div className='open-from-cloud-option-name'>
                                {item.name}
                            </div>
                            <div className='open-from-cloud-option-description'>
                                {item.description}
                            </div>
                            <div className='open-from-cloud-option-date'>
                                {/* Show the date this was saved.
                                    TODO: better formatting;
                                    maybe use moment.js */}
                                Saved on {new Date(item.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                );
            });
        }

        // Render the entire modal
        return (
            <Modal
                className='modal-alt open-from-cloud-modal'
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickClose}
            >
                <h4>Open a saved scene from your Mapzen account</h4>

                <div className='modal-content open-from-cloud-list'>
                    {sceneList}
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
