import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import Icon from '../../src/js/components/Icon';

describe('<Icon />', () => {
    it('creates an <i> element', function () {
        assert.isTrue(shallow(<Icon />).is('i'));
    });

    it('passes through a class for the `type` prop', function () {
        assert.isTrue(shallow(<Icon type='foo' />).contains(<i className='btm foo' />));
    });

    it('set the active class when `active` is true', function () {
        assert.isTrue(shallow(<Icon type='foo' active={true} />).contains(<i className='btm foo icon-active' />));
    });
});
