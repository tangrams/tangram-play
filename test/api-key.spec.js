import { assert } from 'chai';
import { injectAPIKey, suppressAPIKeys } from '../src/js/editor/api-keys';

const TEST_API_KEY = 'mapzen-123456';
const TEST_SUPPRESSED_KEYS = [TEST_API_KEY, 'mapzen-abcdef', 'mapzen-123abc'];

describe('API keys for Mapzen vector tiles', () => {
  describe('injects a missing API key', () => {
    it('adds an API key when it is missing from TopoJSON endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
          },
        },
      };

      // Makes a clone of the `config` object so we can re-use it for the
      // comparison object.
      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    it('adds an API key when it is missing from GeoJSON endpoint', () => {
      // This config also uses https:// instead of protocol-relative url
      const config = {
        sources: {
          mapzen: {
            type: 'GeoJSON',
            url: 'https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.geojson',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    it('adds an API key when it is missing from MVT endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'MVT',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    // This condition happens with Mapzen house styles (e.g. TRON), where the
    // default API key value is an empty string.
    it('adds an API key when the provided parameter is a global variable equal to an empty string', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
            url_params: { api_key: 'global.sdk_mapzen_api_key' },
          },
        },
        global: {
          sdk_mapzen_api_key: '',
        },
      };

      // Makes a clone of the `config` object so we can re-use it for the
      // comparison object.
      const target = JSON.parse(JSON.stringify(config));
      target.global.sdk_mapzen_api_key = TEST_API_KEY;

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    // This condition could happen with Mapzen house styles (e.g. TRON)
    // according to docs: https://github.com/tangrams/cartography-docs/blob/3f4ceba477ad1463b856bfdeb3d2b7e59c68ba43/api-reference.md#sdk_api_key
    it('adds an API key when the provided parameter is a global variable equal to `false`', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
            url_params: { api_key: 'global.sdk_mapzen_api_key' },
          },
        },
        global: {
          sdk_mapzen_api_key: false,
        },
      };

      // Makes a clone of the `config` object so we can re-use it for the
      // comparison object.
      const target = JSON.parse(JSON.stringify(config));
      target.global.sdk_mapzen_api_key = TEST_API_KEY;

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    it('does nothing if an API key is already present in the query string', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=vector-tiles-f00bar',
          },
        },
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.deepEqual(result, config);
    });

    it('does nothing if an API key is already present in the url_params object', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
            url_params: {
              api_key: 'vector-tiles-f00bar',
            },
          },
        },
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.deepEqual(result, config);
    });

    it('does not overwrite other parameters in the url_params object', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
            url_params: {
              foo: 'bar',
            },
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params.api_key = TEST_API_KEY;

      const result = injectAPIKey(config, TEST_API_KEY);

      assert.deepEqual(result, target);
    });

    it('does nothing if the url extension is unfamiliar', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'vtm',
            url: '//tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.vtm',
          },
        },
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.deepEqual(result, config);
    });

    it('does nothing if the tile source is a non-production service', () => {
      // This config also uses https:// instead of protocol-relative url
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: 'https://dev.tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson',
          },
        },
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.deepEqual(result, config);
    });

    it('does nothing if the tile source is a non-Mapzen service', () => {
      // This config also uses https:// instead of protocol-relative url
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//example.tileservice.com/{z}/{x}/{y}.topojson',
          },
        },
      };

      const result = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.deepEqual(result, config);
    });
  });

  describe('suppresses Mapzen’s reserved API keys', () => {
    it('removes keys that match the suppressed API key list', () => {
      const snippet = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
                    osm2:
                        type: GeoJSON
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.geojson?api_key=${TEST_SUPPRESSED_KEYS[1]}
                    osm3:
                        type: MVT
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=${TEST_SUPPRESSED_KEYS[2]}
            `;

      const target = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson
                    osm2:
                        type: GeoJSON
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.geojson
                    osm3:
                        type: MVT
                        url: //tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt
            `;

      const result = suppressAPIKeys(snippet, TEST_SUPPRESSED_KEYS);

      assert.strictEqual(result, target);
    });

    it('leaves keys alone that are not on the suppressed API key list', () => {
      const snippet = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
                    osm2:
                        type: GeoJSON
                        url: https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.geojson?api_key=vector-tiles-f00bar
            `;

      const target = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson
                    osm2:
                        type: GeoJSON
                        url: https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.geojson?api_key=vector-tiles-f00bar
            `;

      const result = suppressAPIKeys(snippet, TEST_SUPPRESSED_KEYS);

      assert.strictEqual(result, target);
    });

    it('leaves keys alone if the tile source is not hosted at vector.mapzen.com', () => {
      // Test snippet re-uses the suppressed keys
      const snippet = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: https://dev.tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
                    osm2:
                        type: TopoJSON
                        url: https://example.tileservice.com/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[1]}
            `;

      const result = suppressAPIKeys(snippet, TEST_SUPPRESSED_KEYS);

      // The result should not differ from the original snippet
      assert.strictEqual(result, snippet);
    });

    // Future
    it('removes keys from inline YAML url');
    it('removes keys when the url is resolved from a global property');
    it('removes keys when the url is resolved from a YAML variable');
  });
});
