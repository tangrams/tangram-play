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
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/default.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/default.yaml',
  },
  'grain': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain.yaml',
  },
  'grain-roads': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain-roads.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain-roads.yaml',
  },
  'grain-area': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain-area.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/grain-area.yaml',
  },
  // For the Mapzen house styles, we will obtain the YAML scene files from
  // Mapzen's carto CDN. Do not store these locally.
  'refill': {
    image: 'https://cloud.githubusercontent.com/assets/853051/11160181/87349950-8a1b-11e5-8559-5c6d95cb84d5.png',
    scene: null,
  },
  'cinnabar': {
    image: 'https://cloud.githubusercontent.com/assets/853051/11084429/f615a860-87ef-11e5-8ca9-6c46cec3534b.png',
    scene: null,
  },
  'zinc': {
    image: 'https://cloud.githubusercontent.com/assets/853051/11136794/c8c54190-8966-11e5-9017-b7f06d6841bb.png',
    scene: null,
  },
  'walkabout': {
    image: 'https://s3.amazonaws.com/static-prod.mapzen.com/resources/maps-page-hero/walkabout-style.png',
    scene: null,
  },
  // End house styles
  'gotham': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/gotham.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/gotham.yaml',
  },
  'blueprint': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/blueprint.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/blueprint.yaml',
  },
  // Deprecated for Tron v2 house style
  // 'tron': {
  //   image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/tron.png',
  //   scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/tron.yaml',
  // },
  'matrix': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/matrix.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/matrix.yaml',
  },
  'ikeda': {
    // Note that the original source is actually an animated GIF, despite the PNG extension
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/ikeda.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/ikeda.yaml',
  },
  '9845c': {
    // Note that the original source is actually an animated GIF, despite the PNG extension
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/9845C.png',
    forcePNG: true, // Special case: force this to be a 1-frame png
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/9845C.yaml',
  },
  'press': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/press.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/press.yaml',
  },
  'radar': {
    // Note that the original source is actually an animated GIF, despite the PNG extension
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/radar.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/radar.yaml',
  },
  'crosshatch': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/crosshatch.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/crosshatch.yaml',
  },
  'pericoli': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/pericoli.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/pericoli.yaml',
  },
  'patterns': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/patterns.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/patterns.yaml',
  },
  'lego': {
    image: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/lego.png',
    scene: 'https://cdn.rawgit.com/tangrams/tangram-sandbox/c6dbf580b691f52f491e3270723b67f879097216/styles/lego.yaml',
  },
};
/* eslint-enable quote-props */

module.exports = IMAGE_SOURCES;
