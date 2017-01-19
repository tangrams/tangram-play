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

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
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

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
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

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
    });

    it('adds an API key when it is missing from a terrain (PNG) endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'Raster',
            url: 'https://tile.mapzen.com/mapzen/terrain/v1/normal/{z}/{x}/{y}.png',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
    });

    it('adds an API key when it is missing from a Terrarium terrain (PNG) endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'Raster',
            url: 'https://tile.mapzen.com/mapzen/terrain/v1/terrarium/{z}/{x}/{y}.png',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
    });

    it('adds an API key when it is missing from a GeoTIFF terrain (TIF) endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'Raster',
            url: 'https://tile.mapzen.com/mapzen/terrain/v1/geotiff/{z}/{x}/{y}.tif',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
    });

    it('adds an API key when it is missing from a Skadi (.hgt.gz) endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'Raster',
            url: 'https://tile.mapzen.com/mapzen/terrain/v1/skadi/{N|S}{y}/{N|S}{y}{E|W}{x}.hgt.gz',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      target.sources.mapzen.url_params = {
        api_key: TEST_API_KEY,
      };

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
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

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
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

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
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

      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      assert.equal(didInjectKey, true);
      assert.deepEqual(config, target);
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

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
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

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
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

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
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
