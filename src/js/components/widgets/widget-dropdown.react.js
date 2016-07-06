import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';

import { setNodeValue } from '../../editor/editor';
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
        this.node = this.props.node;
        this.key = this.node.key;
        this.value = '';
        // this.options = this.node.widgetMark.options;

        if (this.key !== 'source') {
            this.state = {
                options: this.node.widgetMark.options
            };
        }
        else {
            let obj = getAddressSceneContent(tangramLayer.scene, this.node.widgetMark.source);
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

    handleChange (e) {
        this.value = e.target.value;

        this.setEditorValue(this.value);
    }

    /* SHARED METHODS FOR ALL WIDGETS? */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
        this.updateNodeReference(); // Why do we have to do this?

        // Send the value to editor
        setNodeValue(this.node, string, '+value_change');

        // Change the value attached to this widget instance
        this.node.value = string;
    }

    updateNodeReference () {
        // Update a widget on a single-node line
        if (this.bookmark) {
            for (let node of this.bookmark.lines[0].stateAfter.nodes) {
                if (this.node.address === node.address) {
                    this.node = node;
                    break;
                }
            }
        }
      // There was extra code here that didn't seem to do anything in the widget.js Widget class. It has been deleted
    }

    /* END: SHARED METHODS FOR ALL WIDGETS? */

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
    node: React.PropTypes.object,
    bookmark: React.PropTypes.object
};
