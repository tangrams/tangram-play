import { assert } from 'chai';
import { isGistURL, getGistURL } from '../src/js/tools/gist-url';

describe('GitHub Gist url parsing', () => {
  describe('isGistURL(url)', () => {
    it('returns true if url has "api.github.com/gists" in it', () => {
      const test = 'https://api.github.com/gists/foo';
      assert.isTrue(isGistURL(test));
    });

    it('returns true if url has "gist.github.com" in it', () => {
      const test = 'https://gist.github.com/f00/bar';
      assert.isTrue(isGistURL(test));
    });

    it('returns false if url does not have either of those two substrings', () => {
      const test = 'https://example.com/f00/bar';
      assert.isFalse(isGistURL(test));
    });
  });

  describe('getGistURL(url) returns a single Gist API endpoint, given any variation of a possible Gist URL', () => {
    const result = 'https://api.github.com/gists/1234567890abcd';

    // Single Gist API endpoint, with and without trailing slash
    it('accepts https://api.github.com/gists/{gist_id}', () => {
      const test = 'https://api.github.com/gists/1234567890abcd';
      assert.strictEqual(getGistURL(test), result);
      assert.strictEqual(getGistURL(test + '/'), result);
    });

    // Forks for this Gist API endpoint
    it('accepts https://api.github.com/gists/{gist_id}/forks', () => {
      const test = 'https://api.github.com/gists/1234567890abcd/forks';
      assert.strictEqual(getGistURL(test), result);
    });

    // Commits for this Gist API endpoint
    it('accepts https://api.github.com/gists/{gist_id}/commits', () => {
      const test = 'https://api.github.com/gists/1234567890abcd/commits';
      assert.strictEqual(getGistURL(test), result);
    });

    // Single Gist API endpoint with commit SHA
    // TODO: Respect request for a specific commit
    it('accepts https://api.github.com/gists/{gist_id}/{commit_sha}', () => {
      const test = 'https://api.github.com/gists/1234567890abcd/abcd1234567890';
      assert.strictEqual(getGistURL(test), result);
    });

    // HTML url with username
    it('accepts https://gist.github.com/{user}/{gist_id}', () => {
      const test = 'https://gist.github.com/foo/1234567890abcd';
      assert.strictEqual(getGistURL(test), result);
    });

    // HTML url without username
    it('accepts https://gist.github.com/{gist_id}', () => {
      const test = 'https://gist.github.com/1234567890abcd';
      assert.strictEqual(getGistURL(test), result);
    });

    // Git pull/push destination
    it('accepts https://gist.githubusercontent.com/{gist_id}.git', () => {
      const test = 'https://gist.githubusercontent.com/1234567890abcd.git';
      assert.strictEqual(getGistURL(test), result);
    });

    // Raw content URL with username
    it('accepts https://gist.githubusercontent.com/{user}/{gist_id}', () => {
      const test = 'https://gist.githubusercontent.com/foo/1234567890abcd';
      assert.strictEqual(getGistURL(test), result);
    });

    // Raw content URL without username
    it('accepts https://gist.githubusercontent.com/{gist_id}', () => {
      const test = 'https://gist.githubusercontent.com/1234567890abcd';
      assert.strictEqual(getGistURL(test), result);
    });

    // Raw content URL at specific commit SHA
    it('accepts https://gist.githubusercontent.com/{user}/{gist_id}/raw/{commit_sha}/', () => {
      const test = 'https://gist.githubusercontent.com/foo/1234567890abcd/raw/abcd1234567890/';
      assert.strictEqual(getGistURL(test), result);
    });

    // Raw content URL at specific commit SHA and filename
    it('accepts https://gist.githubusercontent.com/{user}/{gist_id}/raw/{commit_sha}/{file_name}', () => {
      const test = 'https://gist.githubusercontent.com/foo/1234567890abcd/raw/abcd1234567890/scene.yaml';
      assert.strictEqual(getGistURL(test), result);
    });
  });

  describe.skip('getSceneURLFromGistAPI(url)', () => {
    // TODO: stub the window.fetch() call
  });
});
