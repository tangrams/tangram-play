import { assert } from 'chai';
import { parseVersionString, isNewMinorVersion } from '../src/js/tools/version';

describe('Version tools', () => {
  describe('parseVersionString()', () => {
    it('returns an object for a version string (1)', () => {
      const obj = parseVersionString('0.5.0');
      const test = {
        major: 0,
        minor: 5,
        patch: 0,
      };

      assert.deepEqual(obj, test);
    });

    it('returns an object for a version string (2)', () => {
      const obj = parseVersionString('4.23.145');
      const test = {
        major: 4,
        minor: 23,
        patch: 145,
      };

      assert.deepEqual(obj, test);
    });
  });

  describe('isNewMinorVersion()', () => {
    it('returns true if current version is higher than previous version', () => {
      const bool1 = isNewMinorVersion('1.0.0', '0.5.0'); // Major higher, minor higher
      const bool2 = isNewMinorVersion('1.0.0', '0.0.10'); // Major higher, patch higher
      const bool3 = isNewMinorVersion('2.0.0', '1.0.0'); // Major higher only
      const bool4 = isNewMinorVersion('1.1.0', '1.0.0'); // Minor higher only
      assert.isTrue(bool1);
      assert.isTrue(bool2);
      assert.isTrue(bool3);
      assert.isTrue(bool4);
    });

    it('returns false if only patch version is newer', () => {
      const bool = isNewMinorVersion('1.1.5', '1.1.0');
      assert.isFalse(bool);
    });

    it('returns false if current version is equal to previous version', () => {
      const bool = isNewMinorVersion('1.2.0', '1.2.0');
      assert.isFalse(bool);
    });

    it('returns false if current version is less than previous version', () => {
      const bool1 = isNewMinorVersion('1.1.0', '2.1.0'); // Major only
      const bool2 = isNewMinorVersion('1.1.0', '1.2.0'); // Minor only
      const bool3 = isNewMinorVersion('1.1.0', '1.1.2'); // Patch only
      assert.isFalse(bool1);
      assert.isFalse(bool2);
      assert.isFalse(bool3);
    });

    it('reads version.json', () => {
      const bool1 = isNewMinorVersion();
      const bool2 = isNewMinorVersion(undefined, '0.4.9');
      const bool3 = isNewMinorVersion(undefined, '999.0.0');
      assert.isTrue(bool1);
      assert.isTrue(bool2);
      assert.isFalse(bool3);
    });
  });
});
