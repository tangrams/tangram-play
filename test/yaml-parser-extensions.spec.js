import { assert } from 'chai';
import YAML from 'yaml-ast-parser';
import { findAnchorRefParents } from '../src/js/editor/codemirror/yaml-parser';

const TEST_DOCUMENT = `
colors:
    blue: &blue [0.078, 0.071, 0.929, 0.00]

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
                color: &color grey
    water:
        data: { source: mapzen }
        draw:
            polygons:
                order: 1
                color: *blue
`;

let parsed;

describe('YAML abstract syntax tree parser extensions', () => {
  it('parses a document with extensioned functionality', () => {
    parsed = findAnchorRefParents(YAML.safeLoad(TEST_DOCUMENT));
    assert.isOk(parsed);
  });
});
