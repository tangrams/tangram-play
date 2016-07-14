import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';

import { setCodeMirrorValue } from '../../editor/editor';
import { tangramLayer } from '../../map/map';
import { getAddressSceneContent } from '../../editor/codemirror/yaml-tangram';
import _ from 'lodash';

import { EventEmitter } from '../event-emitter';

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
        this.key = this.bookmark.widgetInfo.key;
        this.value = '';

        // If the dropdown is NOT of type source
        if (this.key !== 'source') {
            this.state = {
                options: this.bookmark.widgetInfo.widgetMark.options
            };
        }
        // If the dropdown is of type source
        else {
            // Try to find the sources from the tangram scene
            let obj = getAddressSceneContent(tangramLayer.scene, this.bookmark.widgetInfo.widgetMark.source);
            let keys = (obj) ? Object.keys(obj) : {};

            // If the tangram scene has not yet loaded, set an empty options state in order for React to render
            if (_.isEmpty(keys)) {
                keys = [];
            }

            // Keys WILL NOT be empty in cases where users presses 'New' button on the same scene file.
            // Keys WILL be empty when users reload the whole page
            this.state = { options: keys };
        }

        this.handleChange = this.handleChange.bind(this);
        this._setSource = this._setSource.bind(this);
    }

    componentDidMount () {
        // Need to subscribe to when Tangram scene loads in order to populate the source widget
        EventEmitter.subscribe('tangram:sceneinit', this._setSource);
    }

    _setSource () {
        // If the dropdown is of type source then get sources from tangramLayer.scene
        if (this.key === 'source') {
            let obj = getAddressSceneContent(tangramLayer.scene, this.bookmark.widgetInfo.widgetMark.source);
            let keys = (obj) ? Object.keys(obj) : {};

            this.setState({ options: keys });
        }
    }

    handleChange (e) {
        this.value = e.target.value;

        this.setEditorValue(this.value);
    }

    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    render () {
        return (
            <FormGroup className='widget-dropdown' controlId='widget-form-dropdown'>
                <FormControl componentClass='select' className='widget-form-control' placeholder='select' onChange={this.handleChange}>
                    <option value='--select--'>-- select --</option>
                    {this.state.options.map(function (result, i) {
                        return <option key={i} value={result}>{result}</option>;
                    })}
                </FormControl>
            </FormGroup>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetDropdown.propTypes = {
    bookmark: React.PropTypes.object
};
