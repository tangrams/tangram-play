import React from 'react';
import Checkbox from 'react-bootstrap/lib/Checkbox';

import { setCodeMirrorValue } from '../../editor/editor';

/**
 * Represents a boolean checkbox
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

        this.bookmark = this.props.bookmark;

        this.state = {
            value: this.props.value
        };

        this.onChange = this.onChange.bind(this);
    }

    /**
     * Official React lifecycle method
     * Invoked once immediately after the initial rendering occurs.
     * The input default to being 'false'. Have to set it to 'true' if the code value is 'true'
     */
    componentDidMount () {
        if (this.state.value === 'true') {
            this.input.checked = true;
        }
    }

    /**
     * Called anytime user clicks on checkbox
     */
    onChange (e) {
        let newvalue = this.input.checked;
        this.setState({ value: newvalue });

        this.setEditorValue(newvalue.toString());
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
     *
     * this.input refers to the <input> div on the checkbox
     */
    render () {
        return (
            <Checkbox className='widget widget-toggle' onChange={this.onChange} inputRef={ref => { this.input = ref; }}>
            </Checkbox>
        );
    }
}

/**
 * Prop validation required by React
 */
WidgetToggle.propTypes = {
    bookmark: React.PropTypes.object,
    value: React.PropTypes.string
};
