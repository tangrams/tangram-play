import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
// Test: not using the React-Bootstrap <Button> component
// import Button from 'react-bootstrap/lib/Button';
import Icon from './Icon';
import { uniqueInteger } from '../tools/helpers';

export default function IconButton(props) {
  // Break off unexpected props from `props`. This prevents it from being sent
  // to the <button> element improperly.
  const { icon, active, tooltip, tooltipPlacement, className, buttonRef, ...rest } = props;

  // `.btn` is Bootstrap's class
  let classes = 'btn button-icon';

  if (className) {
    classes += ` ${className}`;
  }

  // Note: React-Bootstrap requires an `id` be present for accessibility.
  // The `OverlayTrigger` component will add the paired `aria-describedby`
  // attribute to the <Button> component. We are not using the Bootstrap
  // <Button> so the `aria-describedby` attribute is added here.
  // We use the locally-unique random integer generator to create an `id`
  // that can be paired together under the `tooltip_` namespace.
  const tooltipId = `tooltip_${uniqueInteger()}`;
  const tooltipComponent = <Tooltip id={tooltipId}>{tooltip}</Tooltip>;

  return (
    <OverlayTrigger
      rootClose
      placement={tooltipPlacement}
      overlay={tooltipComponent}
      delayShow={200}
    >
      {/* <button> inherits all other props, such as event handlers,
          e.g. `onClick` etc., or state, e.g. `disabled`, via `...rest` */}
      <button className={classes} aria-describedby={tooltipId} ref={buttonRef} {...rest}>
        <Icon type={icon} active={active} />
      </button>
    </OverlayTrigger>
  );
}

IconButton.propTypes = {
  className: React.PropTypes.string,
  icon: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool,
  tooltip: React.PropTypes.string,
  tooltipPlacement: React.PropTypes.string,
  buttonRef: React.PropTypes.func,
};

IconButton.defaultProps = {
  className: '',
  tooltipPlacement: 'bottom',
  buttonRef: function noop() {},
  active: false,
  tooltip: '',
};
