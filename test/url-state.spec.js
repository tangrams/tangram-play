import { assert } from 'chai';
import { getQueryStringObject, getURLSearchParam, mergeParamObjectToQueryString } from '../src/js/tools/url-state';

describe('URL query parameters management', () => {
  describe('getQueryStringObject()', () => {
    it('returns an empty object when page has no search params', () => {
      const search = '';
      const obj = getQueryStringObject(search);
      assert.isObject(obj);
      assert.deepEqual(obj, {});
    });

    it('returns an object for search params', () => {
      const search = '?scene=foo.yaml&debug=true';
      const obj = getQueryStringObject(search);
      assert.deepEqual(obj, {
        scene: 'foo.yaml',
        debug: 'true', // Expect string, not Boolean type
      });
    });
  });

  describe('getURLSearchParam()', () => {
    it('returns a string value when a requested param is present', () => {
      const search = '?scene=foo.yaml&debug=true';
      const value = getURLSearchParam('debug', search);
      assert.equal(value, 'true');
    });

    it('returns undefined when a requested param is not present', () => {
      const search = '?scene=foo.yaml';
      const value = getURLSearchParam('debug', search);
      assert.isNull(value);
    });
  });

  describe('mergeParamObjectToQueryString()', () => {
    it('merges an object to existing query string', () => {
      const search = '?scene=foo.yaml';
      const obj = {
        debug: 'true',
      };
      const result = mergeParamObjectToQueryString(obj, search);
      assert.equal(result, '?scene=foo.yaml&debug=true');
    });

    it('overwrites properties of existing query string', () => {
      const search = '?scene=foo.yaml&debug=true';
      const obj = {
        lib: 'tangram2.js',
        scene: 'bar.yaml',
      };
      const result = mergeParamObjectToQueryString(obj, search);
      // Test assumes property order is predictable
      assert.equal(result, '?scene=bar.yaml&debug=true&lib=tangram2.js');
    });

    it('creates a query string if previously empty', () => {
      const search = '';
      const obj = {
        lib: 'tangram2.js',
        scene: 'bar.yaml',
      };
      const result = mergeParamObjectToQueryString(obj, search);
      // Test assumes property order is predictable
      assert.equal(result, '?lib=tangram2.js&scene=bar.yaml');
    });
  });
});
