/**
 * This exports URLs for YAML scene files and screenshot images for the example
 * scenes that Tangram Play uses. Only files that are hosted on third-party
 * remote services, like GitHub, Rawgit, or others, should be stored here.
 * Scene files hosted on Mapzen servers do not need to be cached in this
 * repository.
 */

/* eslint-disable quote-props */
const IMAGE_SOURCES = {
    'default': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/default.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/default.yaml'
    },
    'grain': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain.yaml'
    },
    'grain-roads': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-roads.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-roads.yaml'
    },
    'grain-area': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-area.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/grain-area.yaml'
    },
    // For the Mapzen house styles, we will obtain the YAML scene files from
    // Mapzen's carto CDN. Do not store these locally.
    'refill': {
        image: 'https://cloud.githubusercontent.com/assets/853051/11160181/87349950-8a1b-11e5-8559-5c6d95cb84d5.png',
        scene: null
    },
    'cinnabar': {
        image: 'https://cloud.githubusercontent.com/assets/853051/11084429/f615a860-87ef-11e5-8ca9-6c46cec3534b.png',
        scene: null
    },
    'zinc': {
        image: 'https://cloud.githubusercontent.com/assets/853051/11136794/c8c54190-8966-11e5-9017-b7f06d6841bb.png',
        scene: null
    },
    'walkabout': {
        image: 'https://s3.amazonaws.com/static-prod.mapzen.com/resources/maps-page-hero/walkabout-style.png',
        scene: null
    },
    // End house styles
    'gotham': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/gotham.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/gotham.yaml'
    },
    'blueprint': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/blueprint.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/blueprint.yaml'
    },
    'tron': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/tron.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/tron.yaml'
    },
    'matrix': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/matrix.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/matrix.yaml'
    },
    'ikeda': {
        // Note that the original source is actually an animated GIF, despite the PNG extension
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/ikeda.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/ikeda.yaml'
    },
    '9845c': {
        // Note that the original source is actually an animated GIF, despite the PNG extension
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/9845C.png',
        forcePNG: true, // Special case: force this to be a 1-frame png
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/9845C.yaml'
    },
    'press': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/press.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/press.yaml'
    },
    'radar': {
        // Note that the original source is actually an animated GIF, despite the PNG extension
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/radar.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/radar.yaml'
    },
    'crosshatch': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/crosshatch.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/crosshatch.yaml'
    },
    'pericoli': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/pericoli.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/pericoli.yaml'
    },
    'patterns': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/patterns.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/patterns.yaml'
    },
    'lego': {
        image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/lego.png',
        scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/1d60a85ed384150d8a98c26fa30f5a4123c1224f/styles/lego.yaml'
    }
};
/* eslint-enable quote-props */

module.exports = IMAGE_SOURCES;
