import React from 'react';
import Checkbox from 'react-bootstrap/lib/Checkbox';

import { setCodeMirrorValue } from '../../editor/editor';

/**
 * Represents a boolean checkbox
 */
export default class WidgetToggle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value,
    };

    this.onChange = this.onChange.bind(this);
  }

  /**
   * React lifecycle method: invoked once immediately after initial rendering.
   * The input default to being 'false'. Have to set it to 'true' if the code value is 'true'
   */
  componentDidMount() {
    if (this.state.value === 'true') {
      this.input.checked = true;
    }
  }

  /**
   * Called anytime user clicks on checkbox
   */
  onChange(e) {
    const newvalue = this.input.checked;
    this.setState({ value: newvalue });

    this.setEditorValue(newvalue.toString());
  }

  /* SHARED METHOD FOR ALL BOOKMARKS */
  /**
   *  Use this method within a bookmark to communicate a value
   *  back to the Tangram Play editor.
   */
  setEditorValue(string) {
    setCodeMirrorValue(this.props.marker, string);
  }

  render() {
    return (
      <Checkbox
        className="bookmark bookmark-toggle"
        onChange={this.onChange}
        inputRef={(ref) => { this.input = ref; }}
      />
    );
  }
}

WidgetToggle.propTypes = {
  marker: React.PropTypes.object, // eslint-disable-line react/forbid-prop-types
  value: React.PropTypes.string,
};
