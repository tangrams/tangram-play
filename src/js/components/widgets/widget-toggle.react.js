import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';

import { setCodeMirrorValue } from '../../editor/editor';

/**
 * Represents a dropdown widget
 */
export default class WidgetToggle extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);

        this.state = {
            options: this.bookmark.widgetInfo.widgetMark.options
        };

        this.bookmark = this.props.bookmark;

        this.handleChange = this.handleChange.bind(this);
        this._setSource = this._setSource.bind(this);
    }

    /**
     * Called anytime there is a change in the dropdown form. I.e. when user opens or selects something
     */
    handleChange (e) {
        this.value = e.target.value;

        this._setEditorValue(this.value);
    }

    /* SHARED METHOD FOR ALL WIDGETS */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    _setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    /**
     * Official React lifecycle method
     * Called every time state or props are changed
     */
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
WidgetToggle.propTypes = {
    bookmark: React.PropTypes.object
};
