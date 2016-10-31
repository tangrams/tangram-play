import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import Icon from '../../src/js/components/Icon';

describe('<Icon />', () => {
  it('creates an <i> element', () => {
    assert.isTrue(shallow(<Icon type="foo" />).is('i'));
  });

  it('passes through a class for the `type` prop', () => {
    assert.isTrue(shallow(<Icon type="foo" />).contains(<i className="btm foo" />));
  });

  it('set the active class when `active` is true', () => {
    assert.isTrue(shallow(<Icon type="foo" active />).contains(<i className="btm foo icon-active" />));
  });
});
