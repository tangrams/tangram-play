import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import Icon from '../../src/js/components/icon.react';

describe('<Icon />', () => {
    it('creates an <i> element', function () {
        assert.isTrue(shallow(<Icon />).is('i'));
    });

    it('passes through a class for the `type` prop', function () {
        assert.isTrue(shallow(<Icon type='foo' />).contains(<i className='btm foo' />));
    });

    it('passes through a class for the `active` prop', function () {
        assert.isTrue(shallow(<Icon active='bar' />).contains(<i className='btm bar' />));
    });

    it('passes through classes for the `type` and `active` props', function () {
        assert.isTrue(shallow(<Icon type='foo' active='bar' />).contains(<i className='btm foo bar' />));
    });
});
