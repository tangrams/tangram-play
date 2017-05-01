import PropTypes from 'prop-types';
import React from 'react';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import { setCodeMirrorValue } from '../../editor/editor';

export default class BooleanMarker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Incoming prop is a string, cast it to boolean
      isChecked: (this.props.value === 'true'),

      // TODO: disable the checkbox if the value is not a true/false,
      // to prevent this from overwriting other values
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    const value = event.target.checked;
    this.setState({ isChecked: value });
    this.setEditorValue(value.toString());
  }

  /**
   * Communicates a value back to CodeMirror
   */
  setEditorValue(string) {
    setCodeMirrorValue(this.props.marker, string);
  }

  render() {
    return (
      <Checkbox
        className="textmarker textmarker-boolean"
        onChange={this.onChange}
        checked={this.state.isChecked}
      />
    );
  }
}

BooleanMarker.propTypes = {
  marker: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  value: PropTypes.string.isRequired,
};

BooleanMarker.defaultProps = {
  value: false,
};
