import React from 'react';
import ReactDOM from 'react-dom';
import ExamplesModal from '../modals/ExamplesModal';

export default class EditorCallToAction extends React.PureComponent {
    onClickExample() {
        ReactDOM.render(<ExamplesModal />, document.getElementById('modal-container'));
    }

    render() {
        return (
            <div className="editor-no-content">
                <div className="call-to-action modal-well">
                    <h2>Nothing is loaded in Tangram Play.</h2>

                    <button onClick={this.onClickExample}>Choose an example scene</button>

                    {/* Other ideas //
                    <h3>Some of your recent scenes</h3>

                    <ul>
                        <li>Like this one</li>
                        <li>Or this one</li>
                    </ul>

                    <p>
                        Or drag and drop a scene file from your computer onto this window!
                    </p>
                    */}
                </div>
            </div>
        );
    }
}
