import { assert } from 'chai';
import { prependProtocolToUrl } from '../src/js/tools/helpers';

describe('Helpers', () => {
  describe('prependProtocolToUrl()', () => {
    it('makes a protocol-less url protocol-relative', () => {
      const test1 = 'mapzen.com/carto/refill-style/2.0/refill-style.yaml';
      const test2 = 'api.github.com/gists/f00bar';
      const test3 = 'localhost:8000/scene.yaml';

      assert.strictEqual(prependProtocolToUrl(test1), '//' + test1);
      assert.strictEqual(prependProtocolToUrl(test2), '//' + test2);
      assert.strictEqual(prependProtocolToUrl(test3), '//' + test3);
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

    it('ignores urls that should be relative links', () => {
      const test1 = 'data/scenes/empty.yaml';
      const test2 = 'foo.yaml';
      const test3 = '/foo.yaml';
      const test4 = './foo.yaml';
      const test5 = '../foo/bar.yaml';
      const test6 = 'foo.yaml?bar'; // Filename with query string (e.g. for cache-busting)

      assert.strictEqual(prependProtocolToUrl(test1), test1);
      assert.strictEqual(prependProtocolToUrl(test2), test2);
      assert.strictEqual(prependProtocolToUrl(test3), test3);
      assert.strictEqual(prependProtocolToUrl(test4), test4);
      assert.strictEqual(prependProtocolToUrl(test5), test5);
      assert.strictEqual(prependProtocolToUrl(test6), test6);
    });
  });
});
