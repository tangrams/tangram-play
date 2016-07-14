import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';

import { setCodeMirrorValue } from '../../editor/editor';
import { tangramLayer } from '../../map/map';
import { getAddressSceneContent } from '../../editor/codemirror/yaml-tangram';
import _ from 'lodash';

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

        if (this.key !== 'source') {
            this.state = {
                options: this.bookmark.widgetInfo.widgetMark.options
            };
        }
        else {
            let obj = getAddressSceneContent(tangramLayer.scene, this.bookmark.widgetInfo.widgetMark.source);
            console.log(obj);
            let keys = (obj) ? Object.keys(obj) : {};

            // TODO: find out why getAddressSceneContent is returning empty when loading new scene
            if (_.isEmpty(keys)) {
                keys = [];
            }

            this.state = {
                options: keys
            };
        }

        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount () {
        // EventEmitter.subscribe('tangram:sceneinit', this._setLabelPrecision);
        // EventEmitter.subscribe('tangram:sceneinit', data => {
        //     this._setZoomLabel();
        // });
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
