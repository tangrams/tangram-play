import { assert } from 'chai';
import { injectAPIKey, suppressAPIKeys } from '../src/js/editor/api-keys';

const TEST_API_KEY = 'vector-tiles-123456';
const TEST_SUPPRESSED_KEYS = [TEST_API_KEY, 'vector-tiles-abcdef', 'vector-tiles-123abc'];

describe('API keys for Mapzen vector tiles', () => {
    describe('injects a missing API key', () => {
        it('adds an API key when it is missing from TopoJSON endpoint', () => {
            const snippet = `
                sources:
                    osm:
                        type: TopoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson
            `;

            const target = `
                sources:
                    osm:
                        type: TopoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=${TEST_API_KEY}
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            assert.strictEqual(result, target);
        });

        it('adds an API key when it is missing from GeoJSON endpoint', () => {
            // This snippet also uses https:// instead of protocol-relative url
            const snippet = `
                sources:
                    osm:
                        type: GeoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson
            `;

            const target = `
                sources:
                    osm:
                        type: GeoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson?api_key=${TEST_API_KEY}
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            assert.strictEqual(result, target);
        });

        it('adds an API key when it is missing from MVT endpoint', () => {
            const snippet = `
                sources:
                    osm:
                        type: MVT
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt
            `;

            const target = `
                sources:
                    osm:
                        type: MVT
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=${TEST_API_KEY}
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            assert.strictEqual(result, target);
        });

        it('does nothing if an API key is already present', () => {
            const snippet = `
                sources:
                    osm:
                        type: TopoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=vector-tiles-f00bar
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            // The result should not differ from the original snippet
            assert.strictEqual(result, snippet);
        });

        it('does nothing if the url extension is unfamiliar', () => {
            const snippet = `
                sources:
                    osm:
                        type: vtm
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.vtm
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            // The result should not differ from the original snippet
            assert.strictEqual(result, snippet);
        });

        it('does nothing if the tile source is a non-production service', () => {
            // This snippet also uses https:// instead of protocol-relative url
            const snippet = `
                sources:
                    osm:
                        type: TopoJSON
                        url: https://dev.vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            // The result should not differ from the original snippet
            assert.strictEqual(result, snippet);
        });

        it('does nothing if the tile source is a non-Mapzen service', () => {
            const snippet = `
                sources:
                    osm:
                        type: TopoJSON
                        url: //example.tileservice.com/{z}/{x}/{y}.topojson
            `;

            const result = injectAPIKey(snippet, TEST_API_KEY);

            // The result should not differ from the original snippet
            assert.strictEqual(result, snippet);
        });

        // Future
        it('adds a missing key to inline YAML url');
        it('adds a missing key when the url is resolved from a global property');
        it('adds a missing key when the url is resolved from a YAML variable');
    });

    describe('suppresses Mapzen’s reserved API keys', () => {
        it('removes keys that match the suppressed API key list', () => {
            const snippet = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
                    osm2:
                        type: GeoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson?api_key=${TEST_SUPPRESSED_KEYS[1]}
                    osm3:
                        type: MVT
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=${TEST_SUPPRESSED_KEYS[2]}
            `;

            const target = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson
                    osm2:
                        type: GeoJSON
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson
                    osm3:
                        type: MVT
                        url: //vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt
            `;

            const result = suppressAPIKeys(snippet, TEST_SUPPRESSED_KEYS);

            assert.strictEqual(result, target);
        });

        it('leaves keys alone that are not on the suppressed API key list', () => {
            const snippet = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
                    osm2:
                        type: GeoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson?api_key=vector-tiles-f00bar
            `;

            const target = `
                sources:
                    osm1:
                        type: TopoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson
                    osm2:
                        type: GeoJSON
                        url: https://vector.mapzen.com/osm/all/{z}/{x}/{y}.geojson?api_key=vector-tiles-f00bar
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
                        url: https://dev.vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=${TEST_SUPPRESSED_KEYS[0]}
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
