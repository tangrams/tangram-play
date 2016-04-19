import 'babel-polyfill';
import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Karma test with Chai', function () {
    it('should expose the Chai assert method', function () {
        assert.isOk('everything', 'everything is ok');
    });

    it('should work with ES6 fat arrow function', () => {
        assert.ok(true, 'this is ok');
    });

    it('should extend assert with support for Promises', function () {
        return assert.eventually.equal(Promise.resolve(2 + 2), 4, 'This had better be true, eventually');
    });
});
