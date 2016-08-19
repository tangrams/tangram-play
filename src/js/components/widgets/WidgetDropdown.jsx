import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import { isEmpty } from 'lodash';
import { EventEmitter } from '../event-emitter';

import { setCodeMirrorValue, setCursor } from '../../editor/editor';
import { tangramLayer } from '../../map/map';
import { getAddressSceneContent } from '../../editor/codemirror/yaml-tangram';

/**
 * Represents a dropdown widget
 */
export default class WidgetDropdown extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);

        this.bookmark = this.props.bookmark;
        this.key = this.props.keyType;
        this.value = '';

        // If the dropdown is NOT of type source
        if (this.key !== 'source') {
            this.state = {
                options: this.props.options
            };
        }
        // If the dropdown is of type source
        else {
            // Try to find the sources from the tangram scene
            let obj = getAddressSceneContent(tangramLayer.scene, this.props.source);
            let keys = (obj) ? Object.keys(obj) : {};

            // If the tangram scene has not yet loaded, set an empty options state in order for React to render
            if (isEmpty(keys)) {
                keys = [];
            }

            // Keys WILL NOT be empty in cases where users presses 'New' button on the same scene file.
            // Keys WILL be empty when users reload the whole page
            this.state = { options: keys };
        }

        this.onChange = this.onChange.bind(this);
        this.setSource = this.setSource.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    /**
     * React lifecycle function. Gets called once when DIV is mounted
     */
    componentDidMount () {
        // Need to subscribe to when Tangram scene loads in order to populate the source widget
        EventEmitter.subscribe('tangram:sceneinit', this.setSource);
    }

    /**
     * Function called once the Tangram scene has loaded in order to update the source dropdown
     */
    setSource () {
        // If the dropdown is of type source then get sources from tangramLayer.scene
        if (this.key === 'source') {
            let obj = getAddressSceneContent(tangramLayer.scene, this.props.source);
            let keys = (obj) ? Object.keys(obj) : [];

            this.setState({ options: keys });
        }
    }

    /**
     * Called anytime there is a change in the dropdown form. I.e. when user opens or selects something
     */
    onChange (e) {
        this.value = e.target.value;

        this.setEditorValue(this.value);
    }

    /**
     * Called each time dropdown button is clicked to move the cursor to the right line
     */
    onClick () {
        // Set the editor cursor to the correct line. (When you click on the widget button it doesn't move the cursor)
        setCursor(this.bookmark.widgetPos.from.line, this.bookmark.widgetPos.from.ch);
    }

    /* SHARED METHOD FOR ALL WIDGETS */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
    render () {
        if (this.state.options.length !== 0) {
            return (<FormGroup className='widget-dropdown' controlId='widget-form-dropdown' onClick={this.onClick}>
                        <FormControl componentClass='select' className='widget-form-control' placeholder='select' onChange={this.onChange}>
                            {this.state.options.map((result, i) => {
                                return <option key={i} value={result}>{result}</option>;
                            })}
                        </FormControl>
                    </FormGroup>);
        }
        else {
            return null;
        }
    }
}

/**
 * Prop validation required by React
 */
WidgetDropdown.propTypes = {
    bookmark: React.PropTypes.object,
    keyType: React.PropTypes.string,
    options: React.PropTypes.array,
    source: React.PropTypes.string
};

WidgetDropdown.defaultProps = {
    options: []
};
