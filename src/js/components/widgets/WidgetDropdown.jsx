import React from 'react';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import EventEmitter from '../event-emitter';

import { setCodeMirrorValue, setCursor } from '../../editor/editor';
import { tangramLayer } from '../../map/map';
import { getCompiledValueByAddress } from '../../editor/codemirror/yaml-tangram';

/**
 * Represents a dropdown widget
 */
export default class WidgetDropdown extends React.Component {
  constructor(props) {
    super(props);

    let options;

    // If the dropdown is NOT of type source
    if (this.props.keyName !== 'source') {
      // Make a clone so as not to mutate the original props
      options = this.props.options.slice(0);
    } else {
      // If the dropdown is of type source
      // Try to find the sources from the tangram scene
      // If the tangram scene has not yet loaded, set an empty options
      // state in order for React to render
      // Keys WILL NOT be empty in cases where users presses 'New' button on the same scene file.
      // Keys WILL be empty when users reload the whole page
      const obj = getCompiledValueByAddress(tangramLayer.scene, this.props.source);
      options = (obj) ? Object.keys(obj) : [];
    }

    // If the initial value is blank, we add a disabled "select one"
    // choice to the options array.
    if (!this.props.initialValue || this.props.initialValue.length === 0) {
      options.unshift('(select one)');
    }

    // If the initial value in the editor is not one of the options, we
    // append it to the options dropdown. This allows a user to recover the
    // original value easily.
    if (this.props.initialValue && options.indexOf(this.props.initialValue) === -1) {
      options.push(this.props.initialValue);
    }

    this.state = {
      value: this.props.initialValue,
      options,
    };

    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.setSource = this.setSource.bind(this);
  }

  componentDidMount() {
    // Need to subscribe to when Tangram scene loads in order to populate the source widget
    EventEmitter.subscribe('tangram:sceneinit', this.setSource);
  }

  /**
   * Called anytime there is a change in the dropdown form.
   * i.e. when user opens or selects something
   */
  onChange(e) {
    this.setState({
      value: e.target.value,
    });

    this.setEditorValue(e.target.value);
  }

  /**
   * Called each time dropdown button is clicked to move the cursor to the right line
   */
  onClick() {
    // Set the editor cursor to the correct line. (When you click on the
    // button it doesn't move the cursor)
    const pos = this.props.marker.find();
    setCursor(pos.line, pos.ch);
  }

  /**
   * Function called once the Tangram scene has loaded in order to update the source dropdown
   */
  setSource() {
    // If the dropdown is of type source then get sources from tangramLayer.scene
    if (this.props.keyName === 'source') {
      const obj = getCompiledValueByAddress(tangramLayer.scene, this.props.source);
      const keys = (obj) ? Object.keys(obj) : [];

      this.setState({ options: keys });
    }
  }

  /* SHARED METHOD FOR ALL WIDGETS */
  /**
   *  Use this method within a widget to communicate a value
   *  back to the Tangram Play editor.
   */
  setEditorValue(string) {
    setCodeMirrorValue(this.props.marker, string);
  }

  render() {
    if (this.state.options.length !== 0) {
      return (
        <FormGroup
          className="widget-dropdown"
          controlId="widget-form-dropdown"
          onClick={this.onClick}
        >
          <FormControl
            componentClass="select"
            className="widget-form-control"
            placeholder="select"
            onChange={this.onChange}
            value={this.state.value}
          >
            {this.state.options.map((result, i) => (
              <option
                key={i}
                value={result}
                disabled={result === '(select one)'}
              >
                {result}
              </option>
            ))}
          </FormControl>
        </FormGroup>
      );
    }

    // No options, return no component
    return null;
  }
}

WidgetDropdown.propTypes = {
  marker: React.PropTypes.shape({
    find: React.PropTypes.func,
  }),
  keyName: React.PropTypes.string,
  options: React.PropTypes.arrayOf(React.PropTypes.string),
  source: React.PropTypes.string,
  initialValue: React.PropTypes.string,
};

WidgetDropdown.defaultProps = {
  options: [],
};
