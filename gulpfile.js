'use strict'

var gulp = require('gulp')

gulp.task('css', function () {
  var postcss = require('gulp-postcss')
  var sourcemaps = require('gulp-sourcemaps')
  var cssnano = require('cssnano')
  var autoprefixer = require('autoprefixer-core')
  //var cssnext = require('cssnext')
  var cssImport = require('postcss-import')
  var nested = require('postcss-nested')
  var reporter = require('postcss-reporter')
  var simplevars = require('postcss-simple-vars')

  var plugins = [
    //cssnext(),
    cssImport,
    nested,
    simplevars,
    autoprefixer({ browsers: ['last 2 versions', 'IE >= 11'] }),
    cssnano({ comments: { removeAll: true }, zindex: false }),
    reporter()
  ]

  return gulp.src('./src/css/main.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./css'))
})
