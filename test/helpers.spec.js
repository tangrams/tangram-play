import { assert } from 'chai';
import { prependProtocolToUrl } from '../src/js/tools/helpers';

describe('Helpers', () => {
    describe('prependProtocolToUrl()', () => {
        it('makes a protocol-less url protocol-relative', () => {
            const test1 = 'mapzen.com/carto/refill-style/2.0/refill-style.yaml';
            const test2 = 'api.github.com/gists/f00bar';

            const result1 = prependProtocolToUrl(test1);
            const result2 = prependProtocolToUrl(test2);

            assert.strictEqual(result1, '//' + test1);
            assert.strictEqual(result2, '//' + test2);
        });

        it('ignores urls that already have a scheme', () => {
            const test1 = '//mapzen.com/carto/refill-style/2.0/refill-style.yaml';
            const test2 = 'https://mapzen.com/carto/refill-style/2.0/refill-style.yaml';
            const test3 = 'http://api.github.com/gists/f00bar';
            const test4 = 'file:///Users/user/Downloads/refill-style.yaml';

            assert.strictEqual(prependProtocolToUrl(test1), test1);
            assert.strictEqual(prependProtocolToUrl(test2), test2);
            assert.strictEqual(prependProtocolToUrl(test3), test3);
            assert.strictEqual(prependProtocolToUrl(test4), test4);
        });
    });
});
