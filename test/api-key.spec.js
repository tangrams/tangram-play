import { assert } from 'chai';
import { injectAPIKey } from '../src/js/editor/api-keys';

const TEST_API_KEY = 'mapzen-1234567';

describe('API keys for vector tiles', () => {
  describe('injects a missing API key', () => {
    it('adds an API key when it is missing from TopoJSON endpoint', () => {
      const config = {
        sources: {
          mapzen: {
            type: 'TopoJSON',
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson',
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
            url: 'https://tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.geojson',
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
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.mvt',
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
            url: 'https://tile.nextzen.org/tilezen/terrain/v1/normal/{z}/{x}/{y}.png',
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
            url: 'https://tile.nextzen.org/tilezen/terrain/v1/terrarium/{z}/{x}/{y}.png',
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
            url: 'https://tile.nextzen.org/tilezen/terrain/v1/geotiff/{z}/{x}/{y}.tif',
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
            url: 'https://tile.nextzen.org/tilezen/terrain/v1/skadi/{N|S}{y}/{N|S}{y}{E|W}{x}.hgt.gz',
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
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=vector-tiles-f00bar1',
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
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson',
            url_params: {
              api_key: 'vector-tiles-f00bar1',
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
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson',
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
            url: '//tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.vtm',
          },
        },
      };

      const target = JSON.parse(JSON.stringify(config));
      const didInjectKey = injectAPIKey(config, TEST_API_KEY);

      // The result should not differ from the original config
      assert.equal(didInjectKey, false);
      assert.deepEqual(config, target);
    });

    it('does nothing if the tile source is a non-Nextzen service', () => {
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

});
