import React from 'react';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../components/Icon';

import { load } from '../tangram-play';
import EXAMPLES_DATA from './examples.json';

export default class ExamplesModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            selected: null
        };

        this.onClickCancel = this.onClickCancel.bind(this);
        this.onClickConfirm = this.onClickConfirm.bind(this);
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

    render () {
        // Create a <section> per category
        const examples = EXAMPLES_DATA.map((category, categoryIndex) => {
            // Create elements for each scene
            const scenes = category.scenes.map((scene, sceneIndex) => {
                // Unique index made by concatenating category and scene index
                const index = String(categoryIndex) + '.' + String(sceneIndex);

                // Inline style to display thumbnail image
                const thumbnailStyle = {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backgroundImage: 'url(' + scene.thumb + ')'
                };

                // If the scene is selected, a special class is applied
                // to indicate that
                let classString = 'example-option';

                if (this.state.selected === scene.url) {
                    classString += ' example-selected';
                }

                // Render a thumbnail container element
                return (
                    <div
                        className={classString}
                        key={index}
                        data-value={scene.url}
                        onClick={() => { this.setState({ selected: scene.url }); }}
                        onDoubleClick={this.onClickConfirm}
                    >
                        <div className="example-option-name">{scene.name}</div>
                        <div className="example-thumbnail" style={thumbnailStyle} />
                    </div>
                );
            });

            // Render the category container element
            return (
                <section key={categoryIndex}>
                    <h2 className="example-list-header">{category.category}</h2>
                    <hr />
                    {scenes}
                </section>
            );
        });

        // Render the entire modal
        return (
            <Modal
                className="modal-alt example-modal"
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickCancel}
            >
                <h4>Choose an example to open</h4>

                <div className="modal-content example-list">
                    {examples}
                </div>

                <div className="modal-buttons">
                    <Button onClick={this.onClickCancel} className="modal-cancel">
                        <Icon type="bt-times" /> Cancel
                    </Button>
                    <Button
                        onClick={this.onClickConfirm}
                        className="modal-confirm"
                        disabled={this.state.selected === null}
                    >
                        <Icon type="bt-check" /> Open
                    </Button>
                </div>
            </Modal>
        );
    }
}
