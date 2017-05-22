import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { noop } from 'lodash';

export default class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.storeRefs = this.storeRefs.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleEscKey = this.handleEscKey.bind(this);
    this.handleEnterKey = this.handleEnterKey.bind(this);
  }

  componentDidMount() {
    // Add listeners for keys
    window.addEventListener('keydown', this.onKeyDown, false);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown, false);
  }

  onKeyDown(event) {
    const key = event.keyCode || event.which;

    switch (key) {
      case 13:
        this.handleEnterKey(event);
        break;
      case 27:
        this.handleEscKey(event);
        break;
      default:
        break;
    }
  }

  /**
   * Stores reference to this modal's DOM node locally, and sends to parent
   * component if a callback function is provided.
   */
  storeRefs(ref) {
    this.el = ref;
    this.props.setRef(ref);
  }

  /**
   * Handles when the Enter key is pressed.
   * Should be the same function as if you pressed the Confirm button.
   * Events are passed to the function as the first parameter.
   */
  handleEnterKey(event) {
    // By default, the confirmFunction prop is a no-op
    this.props.confirmFunction(event);
  }

  /**
   * Handles when the Escape key is pressed.
   * Should be the same function as if you pressed the Cancel button.
   * Events are passed to the function as the first parameter.
   */
  handleEscKey(event) {
    // Bail if escape disabled via props
    if (this.props.disableEsc === true) return;

    if (this.props.cancelFunction !== noop) {
      this.props.cancelFunction(event);
    }
  }

  render() {
    let classNames = 'modal';

    if (this.props.className) {
      classNames = `${classNames} ${this.props.className}`;
    }

    return (
      <div className="modal-container">
        <div className={classNames} ref={this.storeRefs}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disableEsc: PropTypes.bool,
  cancelFunction: PropTypes.func,
  confirmFunction: PropTypes.func,
  setRef: PropTypes.func,
};

Modal.defaultProps = {
  className: '',
  disableEsc: false,
  cancelFunction: noop,
  confirmFunction: noop,
  setRef: noop,
};
