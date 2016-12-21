import { assert } from 'chai';
import { ParsedYAMLDocument, getKeyAddressForNode } from '../src/js/editor/yaml-ast';

// YAML node kinds are assigned a number by YAMLParser.
const YAML_SCALAR = 0;
const YAML_MAPPING = 1;
// const YAML_MAP = 2;
const YAML_SEQUENCE = 3;

const TEST_DOCUMENT = `
import:
    - components/globals.yaml
    - styles/common.yaml
    - layers/water.yaml

sources:
    mapzen:
        type: TopoJSON
        url: https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.topojson

layers:
    earth:
        data: { source: mapzen }
        draw:
            polygons:
                order: 0
                color: grey
    water:
        data: { source: mapzen }
        draw:
            polygons:
                order: 1
                color: lightblue
`;

let parsed;

describe('YAML abstract syntax tree parser', () => {
  it('parses a document', () => {
    const doc = new ParsedYAMLDocument(TEST_DOCUMENT);
    parsed = doc;
    assert.isOk(parsed.nodes);
  });

  describe('getNodeAtIndex()', () => {
    it('returns a mapping node', () => {
      const node = parsed.getNodeAtIndex(1);
      assert.equal(node.kind, YAML_MAPPING);
    });

    it('returns a sequence node', () => {
      const node = parsed.getNodeAtIndex(13);
      assert.equal(node.kind, YAML_SEQUENCE);
    });

    it('returns a scalar node of a mapping parent node', () => {
      const node = parsed.getNodeAtIndex(200);
      assert.equal(node.kind, YAML_SCALAR);
      assert.equal(node.parent.kind, YAML_MAPPING);
    });

    it('returns a scalar node of a sequence parent node', () => {
      const node = parsed.getNodeAtIndex(50);
      assert.equal(node.kind, YAML_SCALAR);
      assert.equal(node.parent.kind, YAML_SEQUENCE);
    });

    it('returns null if index does not correspond to a node', () => {
      const node = parsed.getNodeAtIndex(0);
      assert.isNull(node);
    });

    it('returns null if index is out of bounds', () => {
      const node = parsed.getNodeAtIndex(9999);
      assert.isNull(node);
    });
  });

  describe('getNodeAtKeyAddress()', () => {
    it('returns the mapping node for an address whose value is scalar', () => {
      const node = parsed.getNodeAtKeyAddress('sources:mapzen:url');
      assert.equal(node.kind, YAML_MAPPING);
      assert.equal(node.key.value, 'url');
    });

    it('returns the mapping node for an address whose value is another map', () => {
      const node = parsed.getNodeAtKeyAddress('layers:earth');
      assert.equal(node.kind, YAML_MAPPING);
      assert.equal(node.key.value, 'earth');
    });

    it('returns the mapping node for an address whose value is a sequence', () => {
      const node = parsed.getNodeAtKeyAddress('import');
      assert.equal(node.kind, YAML_MAPPING);
      assert.equal(node.key.value, 'import');
    });

    it('returns null for an address that cannot be found', () => {
      const node = parsed.getNodeAtKeyAddress('foo:bar');
      assert.isNull(node);
    });
  });

  describe('getKeyAddressForNode()', () => {
    it('returns an empty string for a top-level node', () => {
      const address = getKeyAddressForNode(parsed.nodes);
      assert.equal(address, '');
    });

    it('returns the address for a node of type "mapping"', () => {
      const node = parsed.nodes.mappings[1].value.mappings[0].value.mappings[1];
      const address = getKeyAddressForNode(node);
      assert.equal(address, 'sources:mapzen:url');
    });

    it('returns the address for a node of type "scalar"', () => {
      const node = parsed.nodes.mappings[1].value.mappings[0].value.mappings[1].value;
      const address = getKeyAddressForNode(node);
      assert.equal(address, 'sources:mapzen:url');
    });
  });
});
