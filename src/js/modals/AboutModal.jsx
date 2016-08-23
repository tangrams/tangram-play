import React from 'react';
import Modal from './Modal';
import Button from 'react-bootstrap/lib/Button';

import CodeMirror from 'codemirror';
import L from 'leaflet';

export default class AboutModal extends React.PureComponent {
    constructor (props) {
        super(props);

        this.onClickClose = this.onClickClose.bind(this);
    }

    onClickClose () {
        this.component.unmount();
    }

    render () {
        return (
            <Modal
                className='about-modal'
                ref={(ref) => { this.component = ref; }}
                cancelFunction={this.onClickClose}
            >
                <div className='modal-text modal-about-text'>
                    <h4>About Tangram Play (BETA)</h4>

                    <p>
                        {/* Get and display version numbers.
                            Tangram version comes with its own "v" */}
                        Tangram <span className='about-tangram-version'>{window.Tangram.version}</span>
                        {/* Add "v" for Leaflet and CodeMirror */}
                        <br />Leaflet <span className='about-leaflet-version'>{`v${L.version}`}</span>
                        <br />CodeMirror <span className='about-cm-version'>{`v${CodeMirror.version}`}</span>
                    </p>
                    <p>
                        This is a <a href='https://mapzen.com/' target='_blank'>Mapzen</a> project.
                    </p>
                    <p>
                        <a href='https://github.com/tangrams/tangram-play' target='_blank'>View source on GitHub</a>
                    </p>
                </div>

                <div className='modal-buttons'>
                    <Button onClick={this.onClickClose} className='modal-confirm'>Got it</Button>
                </div>
            </Modal>
        );
    }
}
