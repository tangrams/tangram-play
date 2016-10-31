// Polyfills ES2015 features, like Promises, globally.
// This only needs to be done once for the entire test environment.
import 'babel-polyfill';

import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Karma test with Chai', () => {
  it('exposes the Chai assert method', () => {
    assert.isOk('everything', 'everything is ok');
  });

  it('works with ES6 fat arrow function', () => {
    assert.ok(true, 'this is ok');
  });

  it('extends assert with support for Promises', () => {
    return assert.eventually.equal(Promise.resolve(2 + 2), 4, 'This had better be true, eventually');
  });
});
